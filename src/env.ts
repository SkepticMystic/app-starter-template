import { defineEnvVars } from "@sveltejs/kit/env";
import { z } from "zod";

/**
 * Every environment variable the app reads. `$app/env/public` and
 * `$app/env/private` expose nothing that is not declared here — in SvelteKit 3
 * even the deprecated `$env/*` modules are re-exports of them — so this is the
 * complete list, and `src/test/env.test.ts` checks `.env.example` against it.
 *
 * Each entry's `description` is what kit renders as the hover documentation at
 * every import, so it says what the variable is for and what breaks without it.
 *
 * Secrets are dynamic: read from the environment when the server starts, never
 * compiled into the server bundle. A built image can be pulled by anyone with
 * registry access, and rotating a key should not mean rebuilding.
 *
 * Kit runs each `schema` when the server starts AND during the build, so
 * `required` fails a deploy at a moment someone is watching, not months later
 * inside `EmailService.send`. The Docker build and CI satisfy it with the
 * placeholders in `.env.example`.
 *
 * ### The ordering trap
 *
 * A dynamic export is a `const` snapshotted from what kit's `set_env()` fills
 * during `Server.init()`, and `src/instrumentation.server.ts` is evaluated
 * before that — so anything in its import graph that reads a dynamic variable
 * at module scope captures `undefined` permanently. Static ones are inlined at
 * build time and are safe there. See that file.
 */

/**
 * Required: unset or `""` is a misconfiguration, and fails the build and the
 * boot alike.
 *
 * `placeholder` is a well-formed stand-in, used wherever a tool needs *a* value
 * and no real one exists: the test suite's environment (`src/test/env.mock.ts`)
 * and `pnpm auth:check`. Give one when a module parses the value at load —
 * `new URL(...)`, a connection string — and a generated `mock-*` would throw.
 */
const required = (description: string, placeholder?: string) => ({
  description,
  placeholder,
  schema: z.string().min(1, "must be set — see .env.example"),
});

/**
 * Optional: unset and `""` both mean "not configured", and both arrive as
 * `undefined`. That types the export `string | undefined`, so the compiler
 * makes every reader write the unconfigured branch.
 */
const optional = (description: string) => ({
  description,
  schema: z
    .string()
    .optional()
    .transform((value) => value || undefined),
});

/**
 * Inlined at BUILD time, so they are build args, not runtime config. That is
 * why an image is specific to one origin.
 */
const build_time_public = { public: true, static: true } as const;

/**
 * One entry, widened: `defineEnvVars` keeps each entry's exact literal type,
 * so `Object.entries(variables)` does not type-check without this.
 */
type DeclaredVar = {
  description?: string;
  placeholder?: string;
  public?: boolean;
  static?: boolean;
  schema?: z.ZodType;
};

export const variables = defineEnvVars({
  // --- Tier ------------------------------------------------------------------

  APP_ENV: {
    static: true,
    description:
      "Deployment tier: production | preview | development.\n\n" +
      "Namespaces every Redis key (`REDIS_PREFIX`), and is the only thing " +
      "separating the tiers on the shared Upstash instance — changing it logs " +
      "every user out and resets every rate-limit bucket. Static on purpose: " +
      "a missing value fails the build instead of silently merging two tiers' " +
      "keyspaces, and it is safe to read from `instrumentation.server.ts`.",
    schema: z.enum(["production", "preview", "development"]),
  },

  // --- Public: compiled into the client bundle --------------------------------

  PUBLIC_BASE_URL: {
    ...build_time_public,
    ...required(
      "The app's own public origin, e.g. https://app.example.com.\n\n" +
        "Better-Auth's `baseURL`, every email link, the sitemap and the " +
        "passkey relying-party id (`APP.DOMAIN`, derived at module load) — so " +
        "changing it invalidates every registered passkey. Also the origin " +
        "SvelteKit trusts for CSRF checks on the Node target.",
      // `app.const.ts` calls `new URL()` on it at module scope.
      "http://localhost:5173",
    ),
  },
  PUBLIC_SENTRY_DSN: {
    ...build_time_public,
    ...optional(
      "Sentry DSN; public by design. Unset runs with an inert Sentry client " +
        "and no CSP report endpoint.",
    ),
  },
  PUBLIC_CAPTCHA_SITE_KEY: {
    ...build_time_public,
    ...optional(
      "Cloudflare Turnstile site key, rendered by `Captcha.svelte`. Its server " +
        "half is CAPTCHA_SECRET_KEY.",
    ),
  },
  PUBLIC_UMAMI_BASE_URL: {
    ...build_time_public,
    ...optional(
      "Umami origin serving `script.js`. Analytics load only when this and " +
        "PUBLIC_UMAMI_WEBSITE_ID are both set.",
    ),
  },
  PUBLIC_UMAMI_WEBSITE_ID: {
    ...build_time_public,
    ...optional("Umami website id; see PUBLIC_UMAMI_BASE_URL"),
  },

  // --- Data ------------------------------------------------------------------

  DATABASE_URL: required(
    "Postgres connection string (Neon); one branch per tier",
    "postgresql://user:password@localhost/db",
  ),

  UPSTASH_REDIS_REST_URL: required(
    "Upstash REST URL. Better-Auth's secondary storage, rate limits and caches",
    "https://example.upstash.io",
  ),
  UPSTASH_REDIS_REST_TOKEN: required("Upstash REST token"),

  // --- Auth ------------------------------------------------------------------

  BETTER_AUTH_SECRET: required("Better-Auth signing secret"),

  GOOGLE_CLIENT_ID: optional(
    "Google OAuth client id. `auth.ts` registers Google only when this and " +
      "the secret are both set, so unset means no Google button.\n\n" +
      'Never give it a placeholder: a non-empty "TODO" registers the provider ' +
      "with a bogus id, and every sign-in ends on Google's error page.",
  ),
  GOOGLE_CLIENT_SECRET: optional("Google OAuth client secret"),

  POCKETID_BASE_URL: optional(
    "Pocket ID origin. The generic OAuth provider registers only when all " +
      "three POCKETID_* are set.",
  ),
  POCKETID_CLIENT_ID: optional("Pocket ID OAuth client id"),
  POCKETID_CLIENT_SECRET: optional("Pocket ID OAuth client secret"),

  // --- Object storage (Cloudflare R2, over the S3 API) -----------------------

  CLOUDFLARE_ACCOUNT_ID: required(
    "Cloudflare account id; forms the R2 endpoint",
  ),
  R2_BUCKET_NAME: required("R2 bucket; one per tier"),
  R2_ACCESS_KEY_ID: required("R2 access key id"),
  R2_SECRET_ACCESS_KEY: required("R2 secret access key"),

  // --- Image hosting (Cloudinary) --------------------------------------------

  CLOUDINARY_CLOUD_NAME: required("Cloudinary cloud name"),
  CLOUDINARY_API_KEY: required("Cloudinary API key"),
  CLOUDINARY_API_SECRET: required("Cloudinary API secret"),
  CLOUDINARY_UPLOAD_PRESET: optional(
    "Cloudinary upload preset applied to every upload; unset uploads with " +
      "the account defaults",
  ),

  // --- Third parties ---------------------------------------------------------

  EMAIL_FROM: required(
    "From address on every transactional email",
    "test@example.com",
  ),
  RESEND_API_KEY: required(
    "Resend API key. Dev logs emails to the console instead",
  ),

  PAYSTACK_SECRET_KEY: required(
    "Paystack secret key (live in production, test elsewhere)",
  ),

  CAPTCHA_SECRET_KEY: required(
    "Cloudflare Turnstile secret key; server half of PUBLIC_CAPTCHA_SITE_KEY",
  ),

  OPENAI_API_KEY: required("OpenAI key, used for image moderation only"),

  // --- Presentation ----------------------------------------------------------

  LOG_LEVEL: {
    description: "Pino level. Unset logs at `info`",
    schema: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
  },

  NO_COLOR: {
    description: '`"true"` disables colour in pretty-printed dev logs',
    schema: z.string().default("false"),
  },
});

/**
 * {@link variables} as entries, for `src/test/env.mock.ts`,
 * `src/test/env.test.ts` and `scripts/env/check.script.ts`.
 */
export const declared = Object.entries(variables) as [string, DeclaredVar][];
