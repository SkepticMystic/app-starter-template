/**
 * The global mock wall — see AGENTS.md § Testing for why every mocked module is
 * mocked once, here, with a factory that returns an instance memoised on
 * `globalThis`.
 *
 * In short: the `server` project runs with `isolate: false`, so a worker shares
 * one module registry across test files. A module is evaluated once per worker,
 * and wired to whichever mock was live when it was — so a `vi.mock` in a test
 * file would configure an object the code under test may never consult. A test
 * file therefore never calls `vi.mock`; it imports the module and configures the
 * shared instance.
 *
 * `vi.mock` is hoisted above every module-scope binding, so each factory imports
 * what it needs inside itself.
 */

import { beforeEach, vi } from "vite-plus/test";
import { reset_env } from "./env.mock.js";

// ---------------------------------------------------------------------------
// SvelteKit virtual modules
// ---------------------------------------------------------------------------

/**
 * Derived from `src/env.ts` (`./env.mock.ts`). Returned as the live object, not
 * a copy, so `set_env()` reaches a reader that looks the value up at call time.
 */
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

vi.mock("$app/paths", () => ({
  asset: (path: string) => path,
}));

vi.mock("$app/server", async () => {
  const { memo } = await import("./automock.js");

  // `command` / `query` / `form` hand back their handler, so a test can call
  // what `guarded.ts` builds as a plain function.
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- `vi.mock` is hoisted above module scope, so a module-level helper would not be initialised yet
  const handler = (a: unknown, b?: unknown) => b ?? a;

  return memo("$app/server", async () => ({
    getRequestEvent: vi.fn(),
    read: vi.fn(),
    command: vi.fn(handler),
    query: Object.assign(vi.fn(handler), { batch: vi.fn(handler) }),
    form: vi.fn(handler),
  }));
});

// ---------------------------------------------------------------------------
// Database layer
// ---------------------------------------------------------------------------

/**
 * A proxy that answers every chain with another proxy and is never thenable:
 * enough for a module that builds a query at import, never a result. A test
 * that needs an answer mocks the `Repo` call around the query instead.
 */
vi.mock("#lib/server/db/drizzle.db.js", async () => {
  const { memo } = await import("./automock.js");

  return memo("#lib/server/db/drizzle.db.js", async () => {
    const handler: ProxyHandler<object> = {
      get: (_target, prop) => {
        if (prop === "then") return undefined; // Not thenable
        return new Proxy(() => new Proxy({}, handler), handler);
      },
      apply: () => new Proxy({}, handler),
    };

    return { db: new Proxy({}, handler), pool: new Proxy({}, handler) };
  });
});

/**
 * Every seeded spy is `vi.fn(impl)`, because `vi.resetAllMocks()` restores only
 * an implementation given to `vi.fn` itself. The mock replaces the whole module,
 * so every export must be listed.
 */
vi.mock("#lib/server/db/redis.db.js", async () => {
  const { memo } = await import("./automock.js");

  return memo("#lib/server/db/redis.db.js", async () => ({
    REDIS_PREFIX: "test:test",
    redis: {
      get: vi.fn(async () => null),
      // A real SET answers "OK", and callers read that as "it worked".
      set: vi.fn(async () => "OK"),
      del: vi.fn(async () => 1),
      getdel: vi.fn(async () => null),
      incr: vi.fn(async () => 1),
      expire: vi.fn(async () => 1),
      eval: vi.fn(async () => 1),
      ping: vi.fn(async () => "PONG"),
      // Chainable: callers queue commands on the pipeline before awaiting exec,
      // and a bare `{ exec }` makes that a TypeError.
      pipeline: vi.fn(() => {
        const chain = {
          get: vi.fn(() => chain),
          set: vi.fn(() => chain),
          del: vi.fn(() => chain),
          incr: vi.fn(() => chain),
          expire: vi.fn(() => chain),
          exec: vi.fn(async () => []),
        };

        return chain;
      }),
    },
  }));
});

/**
 * Automocked except `contains` and `order_by`, synchronous builders used while
 * assembling a statement — a mock would put a `Promise` into the `LIKE` or the
 * `ORDER BY`. Its own test runs in the `sql` project, against the real one.
 */
vi.mock("#lib/server/db/repos/index.repo.js", async (io) => {
  const { memo, automock } = await import("./automock.js");

  return memo("#lib/server/db/repos/index.repo.js", async () => {
    const actual =
      await io<typeof import("#lib/server/db/repos/index.repo.js")>();
    const mocked = automock(actual);

    return {
      ...mocked,
      Repo: {
        ...mocked.Repo,
        contains: actual.Repo.contains,
        order_by: actual.Repo.order_by,
      },
    };
  });
});

/**
 * Every query module and service any test mocks. Literal calls rather than a loop,
 * because `vi.mock` is hoisted out of any enclosing block. A module here with
 * its own test asks for the real one with `vi.importActual`.
 */
vi.mock("#lib/server/services/auth/membership.query.js", async (io) => {
  const { mock_module } = await import("./automock.js");

  return mock_module("#lib/server/services/auth/membership.query.js", io);
});

vi.mock("#lib/server/services/audit/audit.query.js", async (io) => {
  const { mock_module } = await import("./automock.js");

  return mock_module("#lib/server/services/audit/audit.query.js", io);
});

vi.mock("#lib/server/services/audit/security_alert.service.js", async (io) => {
  const { mock_module } = await import("./automock.js");

  return mock_module(
    "#lib/server/services/audit/security_alert.service.js",
    io,
  );
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Reduced to what the services under test reach; the knobs are `./auth.mock.ts`. */
vi.mock("#lib/auth.js", async () => {
  const { auth_mock } = await import("./auth.mock.js");
  const { memo } = await import("./automock.js");

  return memo("#lib/auth.js", async () => ({
    auth: {
      api: {
        getSession: auth_mock.getSession,
        deleteOrganization: auth_mock.deleteOrganization,
        createInvitation: auth_mock.createInvitation,
        banUser: auth_mock.banUser,
        unbanUser: auth_mock.unbanUser,
        updateMemberRole: auth_mock.updateMemberRole,
        signOut: auth_mock.signOut,
      },
      get $context() {
        return Promise.resolve({ internalAdapter: auth_mock.internalAdapter });
      },
    },
    is_ba_error_code: auth_mock.is_ba_error_code,
  }));
});

// ---------------------------------------------------------------------------
// External services & side-effect modules
// ---------------------------------------------------------------------------

vi.mock("@sentry/sveltekit", async () => {
  const { memo } = await import("./automock.js");

  return memo("@sentry/sveltekit", async () => ({
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    init: vi.fn(),
    setUser: vi.fn(),
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

/**
 * The real `RateLimiter` over a stubbed client, whose spies are shared by every
 * instance (`./rate_limit.mock.ts`), so a refusal carries the service's own
 * wording. A class, since `RateLimiter` calls `new` on it.
 */
vi.mock("@upstash/ratelimit", async () => {
  const { ratelimit } = await import("./rate_limit.mock.js");
  const { memo } = await import("./automock.js");

  return memo("@upstash/ratelimit", async () => ({
    Ratelimit: class RatelimitStub {
      static tokenBucket(): object {
        return {};
      }

      limit = ratelimit.limit;
      getRemaining = ratelimit.getRemaining;
      resetUsedTokens = ratelimit.resetUsedTokens;
    },
  }));
});

/** `RuntimeService.defer` hands work to it on Vercel. */
vi.mock("@vercel/functions", async () => {
  const { memo } = await import("./automock.js");

  return memo("@vercel/functions", async () => ({
    waitUntil: vi.fn(),
    attachDatabasePool: vi.fn(),
  }));
});

/** A streaming upload that finishes at once; the seam behind `R2Service.put`'s streaming path. */
vi.mock("@aws-sdk/lib-storage", async () => {
  const { memo } = await import("./automock.js");

  return memo("@aws-sdk/lib-storage", async () => ({
    Upload: vi.fn(
      class {
        done = vi.fn(async () => ({ Key: "streamed" }));
      },
    ),
  }));
});

vi.mock("#lib/server/services/email.service.js", async () => {
  const { memo } = await import("./automock.js");

  return memo("#lib/server/services/email.service.js", async () => ({
    // Sent, as both of the real service's backends answer.
    EmailService: {
      send: vi.fn(async () => ({ ok: true, data: undefined })),
    },
  }));
});

/**
 * One `vi.fn` per level, so a test can assert which level a line was written
 * at. `child()` answers with the same object, so a child logger shares the
 * spies.
 */
vi.mock("#lib/utils/logger.util.js", async () => {
  const { memo } = await import("./automock.js");

  return memo("#lib/utils/logger.util.js", async () => {
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

/** In a setup file, so it runs before any hook a test file adds. */
beforeEach(() => {
  /**
   * `reset`, not `clear`, so an earlier file's `mockResolvedValue` is dropped
   * too. It restores only an implementation passed to `vi.fn(impl)`, which is
   * why every seeded mock on the wall is written that way.
   */
  vi.resetAllMocks();

  reset_env();
});
