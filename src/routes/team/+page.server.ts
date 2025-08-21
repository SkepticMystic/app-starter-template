import { auth } from "$lib/auth";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const [members, invitations] = await Promise.all([
    auth.api.listMembers(),
    auth.api.listInvitations(),
  ]);

  return {
    members,
    invitations,
  };
}) satisfies PageServerLoad;
