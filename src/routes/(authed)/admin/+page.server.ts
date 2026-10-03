import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session({ admin: true });
  if (!session.ok) {
    raise(session.error);
  }

  return {};
}) satisfies PageServerLoad;
