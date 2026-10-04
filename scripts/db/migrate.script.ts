/**
 * Apply migrations using the runtime driver rather than drizzle-kit.
 *
 * `pnpm db:migrate` shells out to drizzle-kit, which is a devDependency and so
 * is absent from a pruned production image. This does the same job with only
 * `drizzle-orm` and `pg`, both of which are runtime dependencies already.
 * drizzle-orm's migrator writes the same `drizzle.__drizzle_migrations` ledger,
 * so running both tools is a no-op.
 *
 * Pending migrations are applied in one transaction, so a failure leaves the
 * schema as it was. The run holds a session advisory lock, so two started
 * together queue rather than race. That needs a direct connection: through a
 * transaction-mode pooler (Neon's `-pooler` host) the lock lands on whichever
 * backend served it and stays held there after this process exits, blocking
 * every later run. So `DATABASE_URL_UNPOOLED` wins when set, and a `-pooler`
 * host is turned back into its direct twin. It is still a ONE-SHOT step before
 * rolling out containers, not the image's entrypoint.
 *
 * Run with plain `node`, so every construct here must be erasable
 * (`tsconfig.scripts.json` enforces it) and every import a bare package — no
 * `#lib`. It builds a bare `drizzle()` rather than importing `drizzle.db`,
 * whose env schema would refuse to run without every variable in `src/env.ts`.
 */
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

const MIGRATIONS_FOLDER = "./drizzle";

/** Any constant both runs agree on; only this script takes it. */
const LOCK_KEY = 7_340_211;

const configured =
  process.env["DATABASE_URL_UNPOOLED"] || process.env["DATABASE_URL"];
const url = configured?.replace(/-pooler\./, ".");
if (!url) {
  console.error("[migrate] DATABASE_URL is not set. Cannot migrate.");
  process.exit(1);
}

// Logged first: the step's stdout is the only record of what a release did.
const local = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
console.info(`[migrate] ${local.length} migrations on disk`);
if (url !== configured) {
  console.info("[migrate] using the direct host, not the -pooler one");
}

const client = new Client({ connectionString: url });

// A flag rather than `process.exit` mid-`catch`, so `client.end()` runs and
// the open socket does not keep the process alive or get cut mid-protocol.
let failed = false;

try {
  await client.connect();
  await client.query("select pg_advisory_lock($1)", [LOCK_KEY]);

  await migrate(drizzle({ client }), { migrationsFolder: MIGRATIONS_FOLDER });

  console.info("[migrate] up to date");
} catch (error) {
  console.error("[migrate] failed", error);
  failed = true;
} finally {
  // Ending the session releases the advisory lock with it.
  await client.end().catch(() => undefined);
}

// Non-zero stops the rollout with the old version still serving.
if (failed) {
  process.exit(1);
}
