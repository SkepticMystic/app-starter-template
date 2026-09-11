import { dev } from "$app/environment";
import { PUBLIC_SENTRY_DSN } from "$env/static/public";
import * as Sentry from "@sentry/sveltekit";
import { handleErrorWithSentry } from "@sentry/sveltekit";

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,
  environment: dev ? "development" : "production",

  tracesSampleRate: dev ? 1 : 0.2,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
  //
  // Deprecated in favour of the per-category `dataCollection` option, which
  // does not exist yet on the installed @sentry/sveltekit (10.74.0) — so there
  // is nothing to migrate to. It has to be settled before the v11 bump, which
  // removes this option.
  // oxlint-disable-next-line typescript/no-deprecated
  sendDefaultPii: true,

  spotlight: dev,

  integrations: [],

  ignoreErrors: [
    "NetworkError when attempting to fetch resource",
    "Failed to fetch",
    "Load failed",
  ],
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
