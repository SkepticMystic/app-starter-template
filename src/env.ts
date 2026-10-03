import { defineEnvVars } from "@sveltejs/kit/env";

/**
 * Every environment variable the app reads. `$app/env/public` and
 * `$app/env/private` expose nothing that is not declared here — in SvelteKit 3
 * even the deprecated `$env/*` modules are re-exports of them — so this is the
 * complete list, and `src/test/env.test.ts` checks `.env.example` against it.
 *
 * Secrets are dynamic: read from the environment when the server starts, never
 * compiled into the server bundle. A built image can be pulled by anyone with
 * registry access, and rotating a key should not mean rebuilding.
 *
 * Kit runs each `schema` when the server starts AND during the build, so
 * `required` fails a deploy at a moment someone is watching, not months later
 * inside `EmailService.send`. The Docker build and CI satisfy it with the
 * placeholders in `.env.example`.
 */

/**
 * Unset or empty is unambiguously a misconfiguration. The OAuth providers are
 * deliberately not `required`: `auth.ts` registers Google and Pocket ID only
 * when their credentials are set, so empty is a valid configuration.
 */
const required = {
  schema: (value: string | undefined) => {
    if (!value) throw new Error("must be set — see .env.example");
    return value;
  },
};

/** Unset reads as `""`, which is how callers tell a feature is switched off. */
const optional = {
  schema: (value: string | undefined) => value ?? "",
};

/**
 * Inlined at BUILD time, so they are build args, not runtime config. That is
 * why an image is specific to one origin.
 */
const build_time_public = { public: true, static: true } as const;

export const variables = defineEnvVars({
  // Namespaces every Redis key. Static on purpose: a missing value fails the
  // build instead of silently merging two tiers' keyspaces.
  APP_ENV: { static: true },

  PUBLIC_BASE_URL: build_time_public,
  PUBLIC_SENTRY_DSN: build_time_public,
  PUBLIC_CAPTCHA_SITE_KEY: build_time_public,
  PUBLIC_UMAMI_BASE_URL: build_time_public,
  PUBLIC_UMAMI_WEBSITE_ID: build_time_public,

  DATABASE_URL: required,

  UPSTASH_REDIS_REST_URL: required,
  UPSTASH_REDIS_REST_TOKEN: required,

  BETTER_AUTH_SECRET: required,
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  POCKETID_BASE_URL: optional,
  POCKETID_CLIENT_ID: optional,
  POCKETID_CLIENT_SECRET: optional,

  CLOUDFLARE_ACCOUNT_ID: required,
  R2_BUCKET_NAME: required,
  R2_ACCESS_KEY_ID: required,
  R2_SECRET_ACCESS_KEY: required,

  CLOUDINARY_CLOUD_NAME: required,
  CLOUDINARY_API_KEY: required,
  CLOUDINARY_API_SECRET: required,
  CLOUDINARY_UPLOAD_PRESET: optional,

  EMAIL_FROM: required,
  RESEND_API_KEY: required,

  PAYSTACK_SECRET_KEY: required,

  CAPTCHA_SECRET_KEY: required,

  OPENAI_API_KEY: required,

  LOG_LEVEL: optional,
  NO_COLOR: optional,
});
