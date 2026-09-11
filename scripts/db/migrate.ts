/**
 * Applies pending migrations, once per deploy, from a one-shot container built
 * from the image being deployed — before that image serves any traffic.
 *
 * Deliberately NOT any of the alternatives:
 * - not in `docker build`, because there is no database at build time and it
 *   would run per image build rather than per deploy;
 * - not in the container entrypoint, because every restart of every replica
 *   would race;
 * - not `pnpm db:migrate`, because that needs drizzle-kit and vite-node, i.e.
 *   devDependencies that the runtime image does not carry.
 *
 * Run it with plain `node scripts/db/migrate.ts` — Node strips the types — so
 * this file must stay within erasable syntax: no enums, no namespaces, no
 * parameter properties.
 *
 * It does NOT import `$lib/server/db/drizzle.db`: that module resolves
 * `$app/env/*`, which only exists inside a SvelteKit build.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("migrate: DATABASE_URL is not set");
  process.exit(78); // EX_CONFIG
}

/**
 * Two overlapping deploys would otherwise both read an empty
 * `__drizzle_migrations`, both apply the same `CREATE TABLE`, and the loser
 * would die half-way through. The CI concurrency group makes that unlikely;
 * this makes it impossible, including against a migration run by hand from a
 * laptop at the same moment.
 *
 * The key is arbitrary but must never change.
 */
const LOCK_KEY = "8215041723001";

const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: true },
  max: 1,
});

try {
  const db = drizzle({ client: pool });

  await pool.query("select pg_advisory_lock($1)", [LOCK_KEY]);

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("migrate: up to date");
  } finally {
    await pool.query("select pg_advisory_unlock($1)", [LOCK_KEY]);
  }
} catch (error) {
  console.error("migrate: failed", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
