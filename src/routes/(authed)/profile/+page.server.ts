import { get_session } from "$lib/server/services/auth.service";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session();
  if (!session.ok) {
    error(session.error.status ?? 401, session.error);
  }

  return {
    user: session.data.user,
  };
}) satisfies PageServerLoad;
