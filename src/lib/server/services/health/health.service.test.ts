import { describe, expect, it } from "vite-plus/test";
import { HealthService, type HealthDeps } from "./health.service.js";

// Deps and timeout are injected, not mocked or faked — see `HealthService.check`.
const ok = async () => "ok";

const deps = (over: Partial<HealthDeps> = {}): HealthDeps => ({
  database: ok,
  redis: ok,
  ...over,
});

describe("HealthService.check", () => {
  it("is ok when both dependencies answer", async () => {
    const res = await HealthService.check({ deps: deps() });

    expect(res.ok).toBe(true);
    expect(res.checks.database.ok).toBe(true);
    expect(res.checks.redis.ok).toBe(true);
  });

  it("is not ok, and does not throw, when the database is unreachable", async () => {
    const res = await HealthService.check({
      deps: deps({
        database: async () => {
          throw new Error("connection refused");
        },
      }),
    });

    expect(res.ok).toBe(false);
    expect(res.checks.database.ok).toBe(false);
    expect(res.checks.database.error).toBe("connection refused");
    expect(res.checks.redis.ok).toBe(true);
  });

  it("is not ok when redis is unreachable", async () => {
    const res = await HealthService.check({
      deps: deps({
        redis: async () => {
          throw new Error("redis down");
        },
      }),
    });

    expect(res.ok).toBe(false);
    expect(res.checks.redis.ok).toBe(false);
    expect(res.checks.database.ok).toBe(true);
  });

  it("gives up on a dependency that never answers", async () => {
    const res = await HealthService.check({
      deps: deps({ database: () => new Promise(() => {}) }),
      timeout_ms: 5,
    });

    expect(res.ok).toBe(false);
    expect(res.checks.database.error).toContain("timed out");
    expect(res.checks.redis.ok).toBe(true);
  });

  // A driver error can carry the connection string.
  it("reports a failure message, never the error object", async () => {
    const res = await HealthService.check({
      deps: deps({
        database: async () => {
          throw new Error("no pg_hba.conf entry");
        },
      }),
    });

    expect(res.checks.database.error).toBe("no pg_hba.conf entry");
    expect(JSON.stringify(res)).not.toContain("stack");
  });

  it("survives a dependency that rejects with something that is not an Error", async () => {
    const not_an_error: unknown = "nope";

    const res = await HealthService.check({
      deps: deps({
        redis: async () => {
          throw not_an_error;
        },
      }),
    });

    expect(res.ok).toBe(false);
    expect(res.checks.redis.error).toBe("unknown");
  });
});
