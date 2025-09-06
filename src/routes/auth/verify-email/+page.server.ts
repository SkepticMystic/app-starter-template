import { safe_get_session } from "$lib/auth/server";
import { ROUTES } from "$lib/const/routes.const";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await safe_get_session();
  if (session?.user.emailVerified) {
    redirect(302, ROUTES.HOME);
  }

  return {};
}) satisfies PageServerLoad;
