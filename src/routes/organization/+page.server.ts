import { auth } from "$lib/auth";
import type { PageServerLoad } from "./$types";

export const load = (async ({ request }) => {
  const [members, invitations] = await Promise.all([
    auth.api.listMembers({ headers: request.headers }),
    auth.api.listInvitations({ headers: request.headers }),
  ]);

  return {
    invitations,
    members: members.members,
  };
}) satisfies PageServerLoad;
