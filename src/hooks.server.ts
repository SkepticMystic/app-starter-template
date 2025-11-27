import { building } from "$app/environment";
import { auth } from "$lib/auth";
import * as Sentry from "@sentry/sveltekit";
import type { HandleValidationError } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
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

export const handle = sequence(
  Sentry.sentryHandle(),
  async function _handle({ event, resolve }) {
    return svelteKitHandler({ event, resolve, auth, building });
  },
);
