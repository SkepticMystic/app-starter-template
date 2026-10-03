import { db } from "#lib/server/db/drizzle.db.js";
import { redis } from "#lib/server/db/redis.db.js";
import { Log } from "#lib/utils/logger.util.js";
import { sql } from "drizzle-orm";

const log = Log.child({ service: "Health" });

/**
 * A readiness check: can this process reach its dependencies? A database outage
 * fails every instance at once, so wire it to a readiness probe (or an uptime
 * monitor), never to a liveness probe that restarts.
 */

/** Per dependency: a hung check is worse than a failed one. */
const TIMEOUT_MS = 2_000;

type Check = { ok: boolean; ms: number; error?: string };

/**
 * A losing ping is not cancelled; it settles in the background. Both drivers
 * are HTTP (neon-http, Upstash REST), so that holds no pooled connection — just
 * one in-flight fetch per probe.
 */
const timed = async (
  name: string,
  ping: () => Promise<unknown>,
  timeout_ms: number,
): Promise<Check> => {
  const started = Date.now();

  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      ping(),
      new Promise((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${name} timed out`)),
          timeout_ms,
        );
      }),
    ]);

    return { ok: true, ms: Date.now() - started };
  } catch (error) {
    // Logged, never captured: a probe every few seconds would bury Sentry. `err`, not
    // `error`: Pino serializes an Error only under `err`; otherwise it logs `{}`.
    log.warn({ dependency: name, err: error }, "check.dependency_unreachable");

    return {
      ok: false,
      ms: Date.now() - started,
      // The message only — an error from a driver can carry the connection string.
      error: error instanceof Error ? error.message : "unknown",
    };
  } finally {
    clearTimeout(timer);
  }
};

/** Injectable so tests can stage a failure and a hang without a per-file `vi.mock`. */
export type HealthDeps = {
  database: () => Promise<unknown>;
  redis: () => Promise<unknown>;
};

const DEFAULT_DEPS: HealthDeps = {
  database: () => db.execute(sql`select 1`),
  redis: () => redis.ping(),
};

/** `timeout_ms` is overridable so the test can use real timers and a small budget. */
const check = async (input?: { deps?: HealthDeps; timeout_ms?: number }) => {
  const deps = input?.deps ?? DEFAULT_DEPS;
  const timeout_ms = input?.timeout_ms ?? TIMEOUT_MS;

  const [database, cache] = await Promise.all([
    timed("database", deps.database, timeout_ms),
    timed("redis", deps.redis, timeout_ms),
  ]);

  return {
    ok: database.ok && cache.ok,
    checks: { database, redis: cache },
  };
};

export const HealthService = {
  check,
  TIMEOUT_MS,
};
