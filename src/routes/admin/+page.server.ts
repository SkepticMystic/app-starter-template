import { get_session } from "$lib/auth/server";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  await get_session({ admin: true });

  return {};
}) satisfies PageServerLoad;
