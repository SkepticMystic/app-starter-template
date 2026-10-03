import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session();
  if (!session.ok) {
    raise(session.error);
  } else if (session.data.user.twoFactorEnabled) {
    redirect(302, "/settings/account");
  }

  return {};
}) satisfies PageServerLoad;
