import { auth } from "$lib/auth";
import { App } from "$lib/utils/app";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async (event) => {
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  // Not logged in → go to signup
  if (!session) {
    redirect(302, App.url("/auth/signup"));
  }

  // Already has org → go to app
  if (session.session.activeOrganizationId) {
    redirect(302, App.url("/"));
  }

  // Has session but no org → show onboarding form
  return {};
}) satisfies PageServerLoad;
