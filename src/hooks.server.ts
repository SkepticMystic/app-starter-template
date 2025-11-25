import { sequence } from "@sveltejs/kit/hooks";
import * as Sentry from "@sentry/sveltekit";
import { building, dev } from "$app/environment";
import { auth } from "$lib/auth";
import type { HandleValidationError } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";

// Used by remote function zod schemas
export const handleValidationError: HandleValidationError = ({
  // event,
  issues,
}) => {
  return {
    level: "warning",
    path: issues.at(0)?.path,
    message: issues.at(0)?.message || "Invalid input",
  };
};
export const handleError = Sentry.handleErrorWithSentry();

Sentry.init({
  dsn: "https://02c368cd34cdd0bf6f5928b524a1ade2@o4508915608977408.ingest.de.sentry.io/4510424148017232",
  environment: dev ? "development" : "production",

  // Set tracesSampleRate to 1.0 to capture 100%
  //  of transactions for performance monitoring.
  // We recommend adjusting this value in production, or using tracesSampler
  //  for finer control
  tracesSampleRate: 1.0,

  profilesSampleRate: 1.0, // Profiling sample rate is relative to tracesSampleRate

  spotlight: dev,
  integrations: [
    // Add profiling integration to list of integrations
    // Sentry.redisIntegration(),
    // Sentry.spotlightIntegration(),
    // Sentry.zodErrorsIntegration(),
  ],
});

export const handle = sequence(
  Sentry.sentryHandle(),
  async function _handle({ event, resolve }) {
    return svelteKitHandler({ event, resolve, auth, building });
  },
);
