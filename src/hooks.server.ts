import { building } from "$app/environment";
import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";

// Middleware
export async function handle({ event, resolve }) {
  return svelteKitHandler({ event, resolve, auth, building });
}
