/**
 * Shared test setup — mocks all "toxic" infrastructure modules that have
 * module-level side effects (DB connections, env var reads, external APIs).
 *
 * Configured as `setupFiles` in the vitest project. Harmless for utility tests
 * that never import these modules.
 */

import { vi } from "vite-plus/test";

// ---------------------------------------------------------------------------
// SvelteKit virtual modules
// ---------------------------------------------------------------------------

vi.mock("$env/static/private", () => ({
  ADMIN_EMAIL: "admin@example.com",
  BETTER_AUTH_SECRET: "test-secret-key-for-jwt-signing",
  BETTER_AUTH_URL: "http://localhost:5173",
  CAPTCHA_SECRET_KEY: "mock-captcha-secret",
  CLOUDFLARE_ACCOUNT_ID: "mock-cf-account-id",
  CLOUDINARY_API_KEY: "mock-cloudinary-key",
  CLOUDINARY_API_SECRET: "mock-cloudinary-secret",
  CLOUDINARY_CLOUD_NAME: "mock-cloudinary-cloud",
  CLOUDINARY_UPLOAD_PRESET: "mock-cloudinary-preset",
  DATABASE_URL: "mock://neon",
  EMAIL_FROM: "test@example.com",
  GOOGLE_CLIENT_ID: "mock-google-id",
  GOOGLE_CLIENT_SECRET: "mock-google-secret",
  LOG_LEVEL: "silent",
  NO_COLOR: "true",
  OPENAI_API_KEY: "sk-test-mock",
  PAYSTACK_SECRET_KEY: "sk_test_mock",
  POCKETID_BASE_URL: "",
  POCKETID_CLIENT_ID: "",
  POCKETID_CLIENT_SECRET: "",
  R2_ACCESS_KEY_ID: "mock-r2-key",
  R2_BUCKET_NAME: "mock-bucket",
  R2_SECRET_ACCESS_KEY: "mock-r2-secret",
  RESEND_API_KEY: "re_test_mock_key",
  UPSTASH_REDIS_REST_TOKEN: "mock-redis-token",
  UPSTASH_REDIS_REST_URL: "mock://redis",
}));

vi.mock("$env/static/public", () => ({
  PUBLIC_BASE_URL: "http://localhost:5173",
  PUBLIC_CAPTCHA_SITE_KEY: "mock-captcha-site-key",
  PUBLIC_SENTRY_DSN: "",
  PUBLIC_UMAMI_BASE_URL: "",
  PUBLIC_UMAMI_WEBSITE_ID: "",
}));

vi.mock("$app/environment", () => ({
  dev: true,
  browser: false,
  building: false,
}));

vi.mock("$app/paths", () => ({
  base: "",
  assets: "",
  asset: (path: string) => path,
}));

vi.mock("$app/server", () => ({
  getRequestEvent: vi.fn(),
  read: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Database layer
// ---------------------------------------------------------------------------

vi.mock("$lib/server/db/drizzle.db", () => {
  const handler: ProxyHandler<object> = {
    get: (_target, prop) => {
      if (prop === "then") return undefined; // Not thenable
      return new Proxy(() => new Proxy({}, handler), handler);
    },
    apply: () => new Proxy({}, handler),
  };
  return { db: new Proxy({}, handler) };
});

vi.mock("$lib/server/db/redis.db", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    eval: vi.fn().mockResolvedValue(1),
    pipeline: vi.fn().mockReturnValue({ exec: vi.fn() }),
  },
}));

vi.mock("$lib/server/db/repos/index.repo", () => ({
  Repo: {
    query: vi.fn(),
    insert: vi.fn(),
    insert_one: vi.fn(),
    update: vi.fn(),
    update_one: vi.fn(),
    update_void: vi.fn(),
    delete: vi.fn(),
    delete_one: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// External services & side-effect modules
// ---------------------------------------------------------------------------

vi.mock("@sentry/sveltekit", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  init: vi.fn(),
  setUser: vi.fn(),
  metrics: {
    count: vi.fn(),
    distribution: vi.fn(),
    gauge: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock("@vercel/functions", () => ({
  waitUntil: vi.fn((p: Promise<unknown>) => {
    // Execute the promise so side effects run in tests, but swallow errors
    void p?.catch?.(() => {});
  }),
}));

vi.mock("$lib/server/services/email.service", () => ({
  EmailService: {
    send: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("$lib/utils/logger.util", () => {
  const noop = vi.fn();
  const child = () => logger;
  const logger = {
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
    trace: noop,
    fatal: noop,
    child,
  };
  return { Log: logger };
});
