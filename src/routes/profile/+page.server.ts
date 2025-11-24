import { get_session } from "$lib/auth/server";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session();

  return {
    user: session.user,
  };
}) satisfies PageServerLoad;
