import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session();
  if (!session.ok) {
    raise(session.error);
  }

  return {
    // Not `user`: that key is the root layout's, and this would shadow it for the whole page.
    account: session.data.user,
  };
}) satisfies PageServerLoad;
