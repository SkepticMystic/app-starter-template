import { PUBLIC_SENTRY_DSN } from "$env/static/public";
import * as Sentry from "@sentry/sveltekit";

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,
  environment: import.meta.env.DEV ? "development" : "production",

  tracesSampleRate: 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // SOURCE: https://spotlightjs.com
  spotlight: import.meta.env.DEV,
});
