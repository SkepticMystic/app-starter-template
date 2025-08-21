import { get_session } from "$lib/auth/server";
import type { PageServerLoad } from "./$types";

export const load = (async ({ request }) => {
  await get_session(request, { admin: true });

  return {};
}) satisfies PageServerLoad;
