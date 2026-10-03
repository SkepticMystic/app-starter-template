import { PUBLIC_SENTRY_DSN } from "$app/env/public";
import * as Sentry from "@sentry/sveltekit";

/**
 * The earliest server code SvelteKit runs (`tracing.server`).
 *
 * ### This file's import list is a correctness constraint
 *
 * `adapter-node` evaluates this module before `Server.init()`, which is what
 * fills the *dynamic* exports of `$app/env/private` and `$app/env/public`.
 * Anything reachable from here that reads one of those at module scope
 * captures `undefined` permanently — `logger.util.ts` (`LOG_LEVEL`),
 * `drizzle.db.ts` (`DATABASE_URL`) and `redis.db.ts` among them.
 *
 * Static variables (`static: true` in `src/env.ts`: `APP_ENV` and the
 * `PUBLIC_*` set) are inlined at build time, so the imports above are safe.
 * Everything else is imported dynamically, inside the shutdown handler; keep
 * it that way.
 */

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,
  environment: import.meta.env.DEV ? "development" : "production",

  tracesSampleRate: import.meta.env.DEV ? 1 : 0.1,

  enableLogs: true,
  integrations: [Sentry.pinoIntegration(), Sentry.zodErrorsIntegration()],

  // SOURCE: https://spotlightjs.com
  // spotlight: import.meta.env.DEV,
});

/**
 * Drains deferred work (`RuntimeService.defer`) before a Node process exits.
 *
 * `adapter-node` emits `sveltekit:shutdown` after the HTTP server has closed
 * every connection, with a bare `process.emit` that awaits nothing — so the
 * drain's own pending handles are what keep the process alive, and the
 * listener's `void` is deliberate. Never emitted on Vercel, where
 * `waitUntil` does this job instead.
 *
 * Registered here rather than in `hooks.server.ts`'s `init`, which does not
 * run until the first request: a container stopped before then would never
 * have registered it.
 */
const drain_on_shutdown = async (reason: unknown) => {
  const { RuntimeService } =
    await import("#lib/server/services/runtime/runtime.service.js");

  const result = await RuntimeService.drain();

  // Batched logs and metrics do not hold the process open; without this a
  // stopping process's last seconds never reach Sentry. Resolves `false` on
  // its deadline.
  const sentry_flushed = await Sentry.flush(2_000).then(
    (flushed) => flushed,
    () => false,
  );

  // `console`, not `Log`: pino's transport may already be tearing down.
  console.info(
    `[shutdown] reason=${String(reason)} deferred=${result.initial} lost=${result.lost} ms=${result.ms} sentry_flushed=${sentry_flushed}`,
  );
};

process.on("sveltekit:shutdown", (reason) => {
  void drain_on_shutdown(reason);
});
