import { building } from "$app/env";
import { defineEnvVars } from "@sveltejs/kit/env";
import { z } from "zod";

/**
 * Every environment variable the app reads, replacing `$env/static/*`.
 *
 * Two defaults from `EnvVarConfig` do the heavy lifting and are relied on
 * throughout, so they are worth stating: `static` defaults to `false`, meaning
 * the value is read from the environment when the app STARTS rather than
 * inlined at build time — that is what lets one image serve every tier; and
 * `public` defaults to `false`, meaning the variable is importable only from
 * `$app/env/private`, which SvelteKit treats as a server-only module.
 *
 * `$app/env` is the ONLY module this file may import. Kit loads it in an
 * isolated Vite server and throws `Cannot import $app/* modules other than
 * $app/env inside src/env` for anything else.
 */

/**
 * Validation runs twice against two different environments, and only the
 * second one matters.
 *
 * The build machine's environment is validated by the `prerender` postbuild
 * step, which calls `set_env(env)` unconditionally — whether or not anything
 * is actually prerendered. The container's environment is validated inside
 * `Server.init()`.
 *
 * The whole point of leaving `$env/static/*` is that the image is built
 * WITHOUT production secrets, so demanding them at build time would defeat the
 * migration. Kit calls `internal.set_building()` before importing this module
 * in both build paths, specifically so this short-circuit is possible.
 *
 * The guarantee is not weakened, only relocated: at runtime `building` is
 * false, the real schema applies, and adapter-node top-level-awaits
 * `server.init()` — so a bad value rejects module evaluation and Node exits
 * non-zero having never bound the port. That is strictly stronger than the
 * build-time failure it replaces, because it fires per container start and
 * therefore per tier, rather than once per build.
 */
const at_boot = <T extends z.ZodType>(schema: T): T =>
  (building ? z.any() : schema) as unknown as T;

/**
 * A variable declared without a schema must be a non-empty string, so anything
 * legitimately blank needs an explicit permissive one or the server refuses to
 * start. `OPTIONAL` is that opt-in, and every use of it is a claim that the app
 * genuinely handles a blank value.
 *
 * `.default("")` rather than `.optional()`: an UNSET variable arrives as
 * `undefined`, not `""`, so a bare `z.string()` rejects it — but the consumers
 * of these values guard on truthiness and expect a `string`, not
 * `string | undefined`. Defaulting normalises "unset" and "set to empty" to
 * the same thing, which is what every call site already assumes.
 */
const OPTIONAL = () => at_boot(z.string().default(""));
const REQUIRED = () => at_boot(z.string().min(1));

export const variables = defineEnvVars({
  /**
   * Replaces `VERCEL_ENV`. The VALUES are deliberately unchanged — they are
   * half of every Redis key this app writes. See `src/lib/server/db/redis.db.ts`
   * for why changing one abandons a keyspace rather than migrating it.
   */
  APP_ENV: {
    description:
      "Deployment tier. Half of REDIS_PREFIX — never change an existing value.",
    schema: at_boot(z.enum(["production", "preview", "development"])),
  },

  DATABASE_URL: {
    description: "Postgres connection string (Neon, direct endpoint).",
    schema: at_boot(z.string().startsWith("postgres")),
  },
  BETTER_AUTH_SECRET: { schema: at_boot(z.string().min(32)) },
  UPSTASH_REDIS_REST_URL: { schema: at_boot(z.url()) },
  UPSTASH_REDIS_REST_TOKEN: { schema: REQUIRED() },

  CAPTCHA_SECRET_KEY: { schema: REQUIRED() },
  CLOUDFLARE_ACCOUNT_ID: { schema: REQUIRED() },
  CLOUDINARY_API_KEY: { schema: REQUIRED() },
  CLOUDINARY_API_SECRET: { schema: REQUIRED() },
  CLOUDINARY_CLOUD_NAME: { schema: REQUIRED() },
  CLOUDINARY_UPLOAD_PRESET: { schema: REQUIRED() },
  EMAIL_FROM: { schema: REQUIRED() },
  OPENAI_API_KEY: { schema: REQUIRED() },
  PAYSTACK_SECRET_KEY: { schema: REQUIRED() },
  R2_ACCESS_KEY_ID: { schema: REQUIRED() },
  R2_BUCKET_NAME: { schema: REQUIRED() },
  R2_SECRET_ACCESS_KEY: { schema: REQUIRED() },
  RESEND_API_KEY: { schema: REQUIRED() },

  LOG_LEVEL: {
    schema: at_boot(
      z.enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"]),
    ),
  },
  /** Read by pino; blank is the normal case outside a TTY. */
  NO_COLOR: { schema: OPTIONAL() },

  /**
   * Blank disables the provider — `src/lib/auth.ts` guards both on
   * truthiness, so a deployment without Google or Pocket ID configured is a
   * supported state rather than a misconfiguration.
   */
  GOOGLE_CLIENT_ID: { schema: OPTIONAL() },
  GOOGLE_CLIENT_SECRET: { schema: OPTIONAL() },
  POCKETID_BASE_URL: { schema: OPTIONAL() },
  POCKETID_CLIENT_ID: { schema: OPTIONAL() },
  POCKETID_CLIENT_SECRET: { schema: OPTIONAL() },

  /**
   * The one PUBLIC_ value that differs per tier, and therefore the one that
   * decides whether a single image can serve all three. It is non-static, so
   * it is validated at boot and serialised into each page's payload rather
   * than inlined.
   */
  PUBLIC_BASE_URL: { public: true, schema: at_boot(z.url()) },
  PUBLIC_CAPTCHA_SITE_KEY: { public: true, schema: REQUIRED() },
  PUBLIC_SENTRY_DSN: { public: true, schema: OPTIONAL() },
  PUBLIC_UMAMI_BASE_URL: { public: true, schema: OPTIONAL() },
  PUBLIC_UMAMI_WEBSITE_ID: { public: true, schema: OPTIONAL() },
});
