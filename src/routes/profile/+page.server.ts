import { auth } from "$lib/auth";
import { get_session } from "$lib/auth/server";
import type { PageServerLoad } from "./$types";

export const load = (async ({ request }) => {
  const [session, passkeys, accounts] = await Promise.all([
    get_session(request),
    auth.api.listPasskeys({ headers: request.headers }),
    auth.api.listUserAccounts({ headers: request.headers }),
  ]);

  return { accounts, passkeys, user: session.user };
}) satisfies PageServerLoad;
