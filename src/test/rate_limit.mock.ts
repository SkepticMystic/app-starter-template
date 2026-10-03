import { vi, type Mock } from "vite-plus/test";

/**
 * The knobs for the stubbed `@upstash/ratelimit` in `./setup.ts`: one spy per
 * method `RateLimiter` calls, shared by every instance, so the real
 * `RateLimiter` runs on top and a refusal carries its own wording. Seeded
 * "allowed, with headroom".
 */
const store = globalThis as Record<string, unknown>;

export const ratelimit: {
  limit: Mock;
  getRemaining: Mock;
  resetUsedTokens: Mock;
} = (store["__mock_ratelimit"] ??= {
  limit: vi.fn(async () => ({
    success: true,
    remaining: 999,
    limit: 1000,
    reset: Date.now() + 60_000,
    pending: Promise.resolve(),
  })),
  getRemaining: vi.fn(async () => ({
    remaining: 999,
    reset: Date.now() + 60_000,
  })),
  resetUsedTokens: vi.fn(async () => undefined),
}) as never;
