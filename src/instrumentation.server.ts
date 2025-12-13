import * as Sentry from "@sentry/sveltekit";
import { SENTRY_DSN } from "$env/static/private";

Sentry.init({
  dsn: SENTRY_DSN,
  environment: import.meta.env.DEV ? "development" : "production",

  tracesSampleRate: 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // SOURCE: https://spotlightjs.com
  spotlight: import.meta.env.DEV,
});
