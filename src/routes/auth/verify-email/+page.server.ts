import { resolve } from "$app/paths";
import { safe_get_session } from "$lib/services/auth.service";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await safe_get_session();
  if (session?.user.emailVerified) {
    redirect(302, resolve("/"));
  }

  return {};
}) satisfies PageServerLoad;
