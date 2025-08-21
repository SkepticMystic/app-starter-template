import { auth } from "$lib/auth";
import type { PageServerLoad } from "./$types";

export const load = (async ({ request }) => {
  const session = await auth.api.getSession(request);

  return {};
}) satisfies PageServerLoad;
