import { DATABASE_URL } from "$app/env/private";
import { Log } from "$lib/utils/logger.util";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { relations } from "./relations";

const log = Log.child({ service: "Postgres" });

/**
 * Sizing for ONE container against a Neon compute that autoscales 0.25-0.5 CU
 * (`infra/neon.tf`).
 *
 * `max` is not throughput. A Node process is one thread and mostly awaiting
 * I/O, so ten concurrent statements is already more than it can usefully
 * drive; more connections against a 0.25 CU compute buys memory pressure, not
 * speed. Raise it only with `pg_stat_activity` in hand.
 *
 * `idleTimeoutMillis` is deliberately BELOW Neon's 300s autosuspend window, so
 * the pool actually reaches zero connections when the app is quiet and the dev
 * and preview computes can suspend. The price is a TCP+TLS+auth handshake, and
 * ~500ms more if the compute cold-starts, on the first request after a lull.
 * Do not "fix" that with a keepalive query — it defeats scale-to-zero on every
 * tier and bills a compute that nobody is using.
 *
 * `ssl` is passed explicitly rather than left to the connection string's
 * `sslmode`, because `sslmode=require` means "encrypt but do not verify the
 * certificate", which an active attacker can exploit. Neon's certificates
 * chain to a public root, so Node's bundled CA store verifies them with no
 * extra configuration. An explicit `ssl` here overrides whatever `sslmode` the
 * URL happens to say.
 *
 * Use Neon's DIRECT endpoint here, not the `-pooler` host: PgBouncer exists so
 * that thousands of ephemeral serverless connections do not exhaust Postgres,
 * and this process owns a bounded pool of its own. Stacking the two adds a hop
 * and removes session-level features to solve a problem we no longer have.
 */
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 10,
  min: 0,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  application_name: "app-starter",
});

/**
 * MANDATORY, not defensive.
 *
 * `pg.Pool` emits `error` on an IDLE client whenever the far end goes away — a
 * Neon autosuspend, a compute restart, an ordinary network blip. `EventEmitter`
 * throws on an unhandled `error` event, so without this listener a routine
 * suspend becomes an uncaught exception and kills the container.
 *
 * The HTTP driver this replaces held no sockets and so had no such event: this
 * failure mode is new, and it is the one most likely to be discovered in
 * production rather than in review.
 */
pool.on("error", (error) => {
  log.error({ err: error }, "pool.error idle_client");
});

/**
 * `schema` is no longer passed — drizzle v1 takes `relations` alone, and the
 * table-name casing that used to come from `drizzle.config.ts`'s
 * `casing: "snake_case"` now comes from declaring each table with
 * `snakeCase.table(...)` in the models.
 *
 * `jit` compiles a row mapper per query shape. It changes mapping only, never
 * the SQL that is sent.
 */
export const db = drizzle({ client: pool, relations, jit: true });

/**
 * Bounded, because `pool.end()` waits for every checked-out client to be
 * released and one wedged query would otherwise hold shutdown open until
 * Docker SIGKILLs the container — which looks, in the logs, exactly like a
 * hung process rather than a slow query.
 */
export const db_close = async (timeout_ms = 5_000): Promise<void> => {
  const deadline = new Promise<void>((resolve) => {
    setTimeout(resolve, timeout_ms).unref();
  });

  await Promise.race([pool.end(), deadline]);
};
