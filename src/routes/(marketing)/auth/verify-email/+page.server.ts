import type { ResolvedPathname } from "$app/types";
import { get_session } from "$lib/server/services/auth.service";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session();

  if (session.ok && session.data.user.emailVerified) {
    redirect(302, "/home" satisfies ResolvedPathname);
  }

  return {};
}) satisfies PageServerLoad;
