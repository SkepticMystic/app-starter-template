import { PUBLIC_SENTRY_DSN } from "$env/static/public";
import * as Sentry from "@sentry/sveltekit";

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,
  environment: import.meta.env.DEV ? "development" : "production",

  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,

  enableLogs: true,
  integrations: [Sentry.pinoIntegration(), Sentry.zodErrorsIntegration()],

  // SOURCE: https://spotlightjs.com
  // spotlight: import.meta.env.DEV,
});
