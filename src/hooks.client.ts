import { dev } from "$app/environment";
import { PUBLIC_SENTRY_DSN } from "$env/static/public";
import * as Sentry from "@sentry/sveltekit";
import { handleErrorWithSentry } from "@sentry/sveltekit";

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,
  environment: dev ? "development" : "production",

  tracesSampleRate: 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  spotlight: dev,

  integrations: [],
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
