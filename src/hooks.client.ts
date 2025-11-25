import { dev } from "$app/environment";
import { handleErrorWithSentry } from "@sentry/sveltekit";
import * as Sentry from "@sentry/sveltekit";

Sentry.init({
  dsn: "https://02c368cd34cdd0bf6f5928b524a1ade2@o4508915608977408.ingest.de.sentry.io/4510424148017232",
  environment: dev ? "development" : "production",

  tracesSampleRate: 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  spotlight: dev,
  integrations: [
    // Sentry.browserTracingIntegration(),
    // Sentry.spotlightBrowserIntegration(),
  ],
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
