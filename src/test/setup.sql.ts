/**
 * Setup for the `sql` project, whose repo tests compile real SQL through a real
 * drizzle and the real `Repo` wrapper (AGENTS.md § Testing). `./setup.ts` minus
 * the application mock wall, with a recording drizzle for its database: only
 * what keeps a module off the network and from throwing at import. A repo test
 * reads what was sent, and queues what comes back, on `./sql.mock`.
 */

import type { SQLWrapper } from "drizzle-orm";
import { beforeEach, vi } from "vite-plus/test";
import { reset_env } from "./env.mock.js";
import { reset_recorder } from "./sql.mock.js";

/**
 * A real drizzle over `pg-proxy`, so every statement is compiled by the same
 * Postgres dialect `neon-http` uses and recorded in `./sql.mock`'s `recorder`
 * rather than sent. Here and nowhere else: a repo is evaluated once per worker,
 * so a recorder mocked per test file would only be the one whichever file
 * loaded that repo first.
 *
 * `execute` answers `{ rows }`, as neon-http's does, rather than pg-proxy's bare
 * array. There is no `transaction`: neon-http has none either.
 */
vi.mock("#lib/server/db/drizzle.db.js", async () => {
  const { memo } = await import("./automock.js");
  const { recorder } = await import("./sql.mock.js");
  const { drizzle } = await import("drizzle-orm/pg-proxy");
  const { PgDialect } = await import("drizzle-orm/pg-core");
  const { relations } = await import("#lib/server/db/relations.js");

  const send = (sql: string, params: unknown[]) => {
    recorder.calls.push({ sql, params });

    return recorder.rows.shift() ?? [];
  };

  return memo("sql:#lib/server/db/drizzle.db.js", async () => {
    const proxy = drizzle(
      async (sql: string, params: unknown[]) => ({ rows: send(sql, params) }),
      { relations },
    );

    const dialect = new PgDialect();

    const db = Object.assign(Object.create(proxy) as typeof proxy, {
      execute: async (query: SQLWrapper) => {
        const { sql, params } = dialect.sqlToQuery(query.getSQL());

        return { rows: send(sql, params) };
      },
    });

    return { db };
  });
});

vi.mock("$app/env/private", async () => {
  const { mock_env } = await import("./env.mock.js");

  return mock_env;
});

vi.mock("$app/env/public", async () => {
  const { mock_public_env } = await import("./env.mock.js");

  return mock_public_env;
});

vi.mock("$app/env", () => ({
  dev: true,
  browser: false,
  building: false,
  version: "test",
}));

vi.mock("#lib/server/db/redis.db.js", async () => {
  const { memo } = await import("./automock.js");

  return memo("sql:#lib/server/db/redis.db.js", async () => ({
    REDIS_PREFIX: "test:test",
    redis: {
      get: vi.fn(async () => null),
      set: vi.fn(async () => "OK"),
      del: vi.fn(async () => 1),
      eval: vi.fn(async () => 1),
      expire: vi.fn(async () => 1),
    },
  }));
});

vi.mock("@sentry/sveltekit", async () => {
  const { memo } = await import("./automock.js");

  return memo("sql:@sentry/sveltekit", async () => ({
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    setTag: vi.fn(),
    setContext: vi.fn(),
    metrics: {
      count: vi.fn(),
      distribution: vi.fn(),
      gauge: vi.fn(),
      set: vi.fn(),
    },
  }));
});

vi.mock("#lib/utils/logger.util.js", async () => {
  const { memo } = await import("./automock.js");

  return memo("sql:#lib/utils/logger.util.js", async () => {
    const logger: Record<string, unknown> = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
    };
    logger["child"] = () => logger;

    return { Log: logger };
  });
});

beforeEach(() => {
  vi.resetAllMocks();
  reset_env();
  reset_recorder();
});
