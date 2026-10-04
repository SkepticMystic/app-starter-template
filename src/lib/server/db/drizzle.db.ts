import { DATABASE_URL } from "$app/env/private";
import { AdapterService } from "#lib/server/services/adapter/adapter.service.js";
import { Log } from "#lib/utils/logger.util.js";
import { captureException } from "@sentry/sveltekit";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { relations } from "./relations.js";

/**
 * node-postgres over a pool, so `db.transaction` is a real interactive
 * transaction, and any Postgres works — Neon (point serverless hosts at the
 * `-pooler` endpoint), a container, or a local one. Nothing connects until the
 * first query.
 *
 * `max` is per instance: on Vercel every warm function holds its own pool, so
 * keep it small and let Neon's pgbouncer do the fan-in.
 */
export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});

// An idle client the server drops (a Neon scale-to-zero, a pgbouncer restart)
// is reported on the pool, and an unhandled `error` event takes the process
// down. The pool discards that client itself; this only records it.
pool.on("error", (error) => {
  Log.error(error, "db.pool.idle_client_error");
  captureException(error);
});

AdapterService.attach_db_pool(pool);

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

/** The handle a `db.transaction` callback receives, for helpers that run inside one. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
