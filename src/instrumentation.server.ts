import * as Sentry from "@sentry/sveltekit";

Sentry.init({
  dsn: "https://02c368cd34cdd0bf6f5928b524a1ade2@o4508915608977408.ingest.de.sentry.io/4510424148017232",

  tracesSampleRate: 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // SOURCE: https://spotlightjs.com
  spotlight: import.meta.env.DEV,
});
