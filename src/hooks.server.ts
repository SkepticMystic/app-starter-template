import { building } from "$app/environment";
import { auth } from "$lib/auth";
import type { HandleValidationError } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";

// Middleware
export async function handle({ event, resolve }) {
  return svelteKitHandler({ event, resolve, auth, building });
}

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
