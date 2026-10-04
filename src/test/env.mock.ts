import { declared } from "../env";

/**
 * The test environment, derived from `src/env.ts` so a newly declared variable
 * is mocked the moment it exists and a deleted one disappears. `pnpm auth:check`
 * feeds the same values to Better-Auth's CLI.
 *
 * Only values a test reads, or that `src/env.ts` gives no placeholder for and a
 * module would choke on, are listed. Everything else is derived by
 * {@link build}.
 */
const EXPLICIT: Readonly<Record<string, string>> = {
  /** Outside the schema's three tiers on purpose: no test may share a real keyspace. */
  APP_ENV: "test",

  BETTER_AUTH_SECRET: "test-secret-key-for-jwt-signing",

  /** Not the schema's `info` default. */
  LOG_LEVEL: "silent",
  NO_COLOR: "true",

  /** Optional, but set, so the providers' registered branch is the one loaded. */
  GOOGLE_CLIENT_ID: "mock-google-id",
  GOOGLE_CLIENT_SECRET: "mock-google-secret",

  /** The opt-in kits: set, so their configured branch is the one tested. */
  CLOUDFLARE_ACCOUNT_ID: "mock-cloudflare-account",
  R2_BUCKET_NAME: "mock-bucket",
  R2_ACCESS_KEY_ID: "mock-r2-key",
  R2_SECRET_ACCESS_KEY: "mock-r2-secret",
  CLOUDINARY_CLOUD_NAME: "mock-cloud",
  CLOUDINARY_API_KEY: "mock-cloudinary-key",
  CLOUDINARY_API_SECRET: "mock-cloudinary-secret",
  OPENAI_API_KEY: "mock-openai-key",
};

/**
 * In order: an {@link EXPLICIT} entry; else a required variable's
 * `placeholder`; else what the schema makes of an unset variable — `undefined`
 * for an optional one, the default for a defaulted one; else a
 * generated `mock-*` string.
 */
const build = (want_public: boolean): Record<string, string | undefined> => {
  const out: Record<string, string | undefined> = {};

  for (const [name, config] of declared) {
    // `$app/env/private` excludes public entries, so the two mocks partition the declaration.
    if (Boolean(config.public) !== want_public) continue;

    if (Object.hasOwn(EXPLICIT, name)) {
      out[name] = EXPLICIT[name];
      continue;
    }

    if (config.placeholder !== undefined) {
      out[name] = config.placeholder;
      continue;
    }

    const absent = config.schema?.safeParse(undefined);

    if (absent?.success) {
      if (absent.data === undefined || typeof absent.data === "string") {
        // Present even when `undefined`: a mocked module throws on a missing export.
        out[name] = absent.data;
      } else {
        throw new Error(
          `env.mock: ${name} defaults to a non-string, which this mock cannot hold.`,
        );
      }

      continue;
    }

    out[name] = `mock-${name.toLowerCase().replaceAll("_", "-")}`;
  }

  return out;
};

const DEFAULT_ENV = build(false);

/**
 * The `$app/env/public` mock. Frozen, unlike {@link mock_env}: the public set
 * is `static` — inlined at build time — so a test that tries to override one
 * is testing something production cannot do, and fails loudly.
 */
export const mock_public_env: Readonly<Record<string, string | undefined>> =
  Object.freeze(build(true));

/**
 * The `$app/env/private` mock, memoised on `globalThis` (AGENTS.md § Testing).
 * The mock module *is* this object, and vitest compiles `import { X }` to a
 * property read at each use, so {@link set_env} reaches a reader that looks the
 * value up when it runs — but not one that copied it at module scope
 * (`REDIS_PREFIX`, the Resend and S3 clients), which keeps the default.
 */
const global_store = globalThis as Record<string, unknown>;

export const mock_env: Record<string, string | undefined> = (global_store[
  "__mock_env"
] ??= { ...DEFAULT_ENV }) as Record<string, string | undefined>;

/** Overrides private variables for the current test; call it in a `beforeEach`. */
export const set_env = (vars: Record<string, string | undefined>) => {
  Object.assign(mock_env, vars);
};

/** Called by `setup.ts` before each test. */
export const reset_env = () => {
  for (const key of Object.keys(mock_env)) delete mock_env[key];

  Object.assign(mock_env, DEFAULT_ENV);
};
