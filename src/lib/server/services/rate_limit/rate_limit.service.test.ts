import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

// ---------------------------------------------------------------------------
// Mock @upstash/ratelimit before importing the service
// ---------------------------------------------------------------------------

const { mock_limit, mock_get_remaining, mock_reset_used_tokens } = vi.hoisted(() => ({
  mock_limit: vi.fn(),
  mock_get_remaining: vi.fn(),
  mock_reset_used_tokens: vi.fn(),
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class MockRatelimit {
    static tokenBucket = vi.fn().mockReturnValue(() => ({}));
    limit = mock_limit;
    getRemaining = mock_get_remaining;
    resetUsedTokens = mock_reset_used_tokens;
  },
}));

vi.mock("$lib/server/services/adapter/adapter.service", () => ({
  AdapterService: {
    get_ip: vi.fn().mockReturnValue("127.0.0.1"),
    get_geo: vi.fn().mockReturnValue(undefined),
    get_user_agent: vi.fn().mockReturnValue("test-agent"),
  },
}));

// ---------------------------------------------------------------------------
// Import REAL service (uses mocked @upstash/ratelimit)
// ---------------------------------------------------------------------------

import { RateLimiter } from "./rate_limit.service";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const CONFIG = {
  max_tokens: 10,
  refill_rate: 2,
  refill_interval: 60,
};

let limiter: RateLimiter;

beforeEach(() => {
  vi.clearAllMocks();
  limiter = new RateLimiter("test", CONFIG);
});

// ---------------------------------------------------------------------------
// RateLimiter.consume()
// ---------------------------------------------------------------------------

describe("RateLimiter.consume", () => {
  it("allows request when limit succeeds", async () => {
    mock_limit.mockResolvedValueOnce({
      success: true,
      remaining: 9,
      limit: 10,
      reset: Date.now() + 60_000,
      pending: Promise.resolve(),
    });

    const res = await limiter.consume("user-1");

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.allowed).toBe(true);
      expect(res.data.remaining).toBe(9);
      expect(res.data.retry_after_sec).toBeUndefined();
    }
    expect(mock_limit).toHaveBeenCalledWith("user-1", expect.objectContaining({ rate: 1 }));
  });

  it("passes token count via rate option", async () => {
    mock_limit.mockResolvedValueOnce({
      success: true,
      remaining: 5,
      limit: 10,
      reset: Date.now() + 60_000,
      pending: Promise.resolve(),
    });

    const res = await limiter.consume("user-1", 5);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.allowed).toBe(true);
      expect(res.data.remaining).toBe(5);
    }
    expect(mock_limit).toHaveBeenCalledWith("user-1", expect.objectContaining({ rate: 5 }));
  });

  it("denies when limit returns success: false and includes retry_after_sec", async () => {
    const reset = Date.now() + 120_000;

    mock_limit.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      limit: 10,
      reset,
      pending: Promise.resolve(),
    });

    const res = await limiter.consume("user-1", 5);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.allowed).toBe(false);
      expect(res.data.remaining).toBe(0);
      expect(res.data.retry_after_sec).toBeGreaterThan(0);
      expect(res.data.retry_after_sec).toBeLessThanOrEqual(120);
    }
  });

  it("returns INTERNAL_SERVER_ERROR on exception", async () => {
    mock_limit.mockRejectedValueOnce(new Error("Redis down"));

    const res = await limiter.consume("user-1");

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INTERNAL_SERVER_ERROR");
  });
});

// ---------------------------------------------------------------------------
// RateLimiter.check()
// ---------------------------------------------------------------------------

describe("RateLimiter.check", () => {
  it("returns allowed when enough tokens remain", async () => {
    mock_get_remaining.mockResolvedValueOnce({
      remaining: 10,
      reset: Date.now() + 60_000,
      limit: 10,
    });

    const res = await limiter.check("user-1");

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.allowed).toBe(true);
      expect(res.data.remaining).toBe(9); // 10 - 1 (default tokens param)
    }
    expect(mock_get_remaining).toHaveBeenCalledWith("user-1");
  });

  it("returns allowed with custom token count", async () => {
    mock_get_remaining.mockResolvedValueOnce({
      remaining: 5,
      reset: Date.now() + 60_000,
      limit: 10,
    });

    const res = await limiter.check("user-1", 3);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.allowed).toBe(true);
      expect(res.data.remaining).toBe(2); // 5 - 3
    }
  });

  it("returns not allowed with retry_after_sec when tokens insufficient", async () => {
    const reset = Date.now() + 120_000;

    mock_get_remaining.mockResolvedValueOnce({
      remaining: 0,
      reset,
      limit: 10,
    });

    const res = await limiter.check("user-1", 3);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.allowed).toBe(false);
      expect(res.data.retry_after_sec).toBeGreaterThan(0);
      expect(res.data.retry_after_sec).toBeLessThanOrEqual(120);
    }
  });

  it("does not call limit (read-only)", async () => {
    mock_get_remaining.mockResolvedValueOnce({
      remaining: 5,
      reset: Date.now() + 60_000,
      limit: 10,
    });

    await limiter.check("user-1");

    expect(mock_limit).not.toHaveBeenCalled();
  });

  it("returns INTERNAL_SERVER_ERROR on exception", async () => {
    mock_get_remaining.mockRejectedValueOnce(new Error("Redis down"));

    const res = await limiter.check("user-1");

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INTERNAL_SERVER_ERROR");
  });
});

// ---------------------------------------------------------------------------
// RateLimiter.reset()
// ---------------------------------------------------------------------------

describe("RateLimiter.reset", () => {
  it("resets used tokens", async () => {
    mock_reset_used_tokens.mockResolvedValueOnce(undefined);

    const res = await limiter.reset("user-1");

    expect(res.ok).toBe(true);
    expect(mock_reset_used_tokens).toHaveBeenCalledWith("user-1");
  });

  it("returns INTERNAL_SERVER_ERROR on exception", async () => {
    mock_reset_used_tokens.mockRejectedValueOnce(new Error("Redis down"));

    const res = await limiter.reset("user-1");

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
