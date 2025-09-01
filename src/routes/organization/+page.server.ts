import { auth } from "$lib/auth";
import { AuthSchema } from "$lib/schema/auth.schema";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { PageServerLoad } from "./$types";

export const load = (async ({ request }) => {
  const [member_invite_form_input, members, invitations] = await Promise.all([
    superValidate(zod4(AuthSchema.Org.member_invite_form)),

    auth.api.listMembers({ headers: request.headers }),
    auth.api.listInvitations({ headers: request.headers }),
  ]);

  return {
    invitations,
    members: members.members,
    member_invite_form_input,
  };
}) satisfies PageServerLoad;
