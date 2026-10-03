/**
 * Apply migrations using the runtime driver rather than drizzle-kit.
 *
 * `pnpm db:migrate` shells out to drizzle-kit, which is a devDependency and so
 * is absent from a pruned production image. This does the same job with only
 * `drizzle-orm` and `@neondatabase/serverless`, both of which are runtime
 * dependencies already. drizzle-orm's migrator writes the same
 * `drizzle.__drizzle_migrations` ledger, so running both tools is a no-op.
 *
 * Run it as a ONE-SHOT step before rolling out new containers, never from the
 * image's entrypoint: replicas starting together would race, and the neon-http
 * driver has no transactions, so there is no lock to fall back on.
 *
 * Run with plain `node`, so every construct here must be erasable
 * (`tsconfig.scripts.json` enforces it) and every import a bare package — no
 * `#lib`. It builds a bare `drizzle()` rather than importing `drizzle.db`,
 * whose env schema would refuse to run without every variable in `src/env.ts`.
 */
import { neon } from "@neondatabase/serverless";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const MIGRATIONS_FOLDER = "./drizzle";

const url = process.env["DATABASE_URL"];
if (!url) {
  console.error("[migrate] DATABASE_URL is not set. Cannot migrate.");
  process.exit(1);
}

// Logged first: the step's stdout is the only record of what a release did.
const local = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
console.info(`[migrate] ${local.length} migrations on disk`);

// neon-http is stateless HTTP, so unlike a pg Pool there is no socket to
// `end()` that would keep the process alive. The flag still exits only after
// the `try` has fully unwound, rather than `process.exit` mid-`catch`.
let failed = false;

try {
  await migrate(drizzle({ client: neon(url) }), {
    migrationsFolder: MIGRATIONS_FOLDER,
  });

  console.info("[migrate] up to date");
} catch (error) {
  console.error("[migrate] failed", error);
  failed = true;
}

// Non-zero stops the rollout with the old version still serving.
if (failed) {
  process.exit(1);
}
