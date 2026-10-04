import { dev } from "$app/env";
import { PUBLIC_APP_ENV, PUBLIC_SENTRY_DSN } from "$app/env/public";
import * as Sentry from "@sentry/sveltekit";
import { handleErrorWithSentry } from "@sentry/sveltekit";

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,
  // The tier, matching the server's `APP_ENV`, so preview errors are not filed as production.
  environment: PUBLIC_APP_ENV ?? (dev ? "development" : "production"),

  tracesSampleRate: dev ? 1 : 0.2,

  // No `dataCollection`, on purpose: v11 collects every category when it is
  // unset, which is what the v10 `sendDefaultPii: true` this replaced asked
  // for. The server is the opposite case — see `instrumentation.server.ts`.
  // https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection

  spotlight: dev,

  integrations: [],

  ignoreErrors: [
    "NetworkError when attempting to fetch resource",
    "Failed to fetch",
    "Load failed",
  ],
});

export const handleError = handleErrorWithSentry();
