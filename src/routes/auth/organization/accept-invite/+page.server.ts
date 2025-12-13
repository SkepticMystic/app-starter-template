import { auth } from "$lib/auth";
import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request, url }) => {
  const search = {
    invite_id: url.searchParams.get("invite_id"),
  };
  if (!search.invite_id) {
    error(400, "Missing invite ID");
  }

  const [session, invitation] = await Promise.all([
    auth.api.getSession({ headers: request.headers }),

    Repo.query(
      db.query.invitation.findFirst({
        where: (invitation, { eq }) => eq(invitation.id, search.invite_id!),

        columns: {
          id: true,
          email: true,
          status: true,
          expiresAt: true,
          inviterId: true,
          organizationId: true,
        },
      }),
    ),
  ]);

  if (!session) {
    return {
      search,
      prompt: "signup_login" as const,
    };
  } else if (!invitation.ok) {
    return {
      search,
      session,
      prompt: "internal_server_error" as const,
    };
  } else if (!invitation.data) {
    return {
      search,
      session,
      prompt: "invalid_invite_id" as const,
    };
  } else if (invitation.data.email !== session.user.email) {
    return {
      search,
      session,
      inviter: null,
      invitation: null,
      organization: null,
      prompt: "wrong_account" as const,
    };
  } else if (invitation.data.status !== "pending") {
    return {
      search,
      session,
      invitation,
      prompt: "invite_not_pending" as const,
    };
  } else if (invitation.data.expiresAt < new Date()) {
    return {
      search,
      session,
      invitation,
      prompt: "invite_expired" as const,
    };
  }

  const { inviterId, organizationId } = invitation.data;

  const [organization, inviter, member] = await Promise.all([
    Repo.query(
      db.query.organization.findFirst({
        columns: { name: true },

        where: (organization, { eq }) => eq(organization.id, organizationId),
      }),
    ),

    Repo.query(
      db.query.user.findFirst({
        columns: { name: true, email: true },

        where: (user, { eq }) => eq(user.id, inviterId),
      }),
    ),

    Repo.query(
      db.query.member.findFirst({
        columns: { id: true },

        where: (member, { and, eq }) =>
          and(
            eq(member.userId, session.user.id),
            eq(member.organizationId, organizationId),
          ),
      }),
    ),
  ]);

  if (!organization.ok || !organization.data) {
    error(400, "Invalid invitation: organization does not exist");
  } else if (!inviter.ok || !inviter.data) {
    error(400, "Invalid invitation: inviter does not exist");
  } else if (member.ok && member.data) {
    return {
      search,
      session,
      inviter: inviter.data,
      invitation: invitation.data,
      organization: organization.data,
      prompt: "already_member" as const,
    };
  } else {
    return {
      search,
      session,
      inviter: inviter.data,
      invitation: invitation.data,
      organization: organization.data,
      prompt: "accept_invite" as const,
    };
  }
};
