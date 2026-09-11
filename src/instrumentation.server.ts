import * as Sentry from "@sentry/sveltekit";

/**
 * Read from `process.env`, NOT from `$app/env/*`.
 *
 * `builder.instrument()` emits a facade that evaluates this module and only
 * then `await import('./start.js')` — so this runs before `Server.init()` has
 * called `set_env`, and anything imported from `$app/env/*` here is
 * `undefined`. It worked before the migration only because
 * `$env/static/public` was an inlined literal rather than a real read.
 *
 * The failure is silent: `Sentry.init({ dsn: undefined })` disables reporting
 * without complaining, so the first sign would be an empty Sentry project.
 */
const DSN = process.env.PUBLIC_SENTRY_DSN;

/**
 * `import.meta.env.DEV` is resolved at BUILD time. One image now serves every
 * tier, so it would label preview and development traffic as "production" and
 * mix three tiers into one Sentry environment.
 */
const APP_ENV = process.env.APP_ENV ?? "development";
const IS_DEV = APP_ENV === "development";

const TRACES_SAMPLE_RATE = IS_DEV ? 1 : 0.1;

Sentry.init({
  dsn: DSN,
  environment: APP_ENV,

  /**
   * The container healthcheck and the reverse proxy both poll `/healthz` every
   * few seconds for the life of the process. Sampling them would bury real
   * traffic in probe spans and spend the quota on nothing.
   */
  tracesSampler: ({ name, inheritOrSampleWith }) =>
    name.includes("/healthz") || name.includes("/readyz")
      ? 0
      : inheritOrSampleWith(TRACES_SAMPLE_RATE),

  enableLogs: true,
  integrations: [Sentry.pinoIntegration(), Sentry.zodErrorsIntegration()],

  // SOURCE: https://spotlightjs.com
  // spotlight: IS_DEV,
});
