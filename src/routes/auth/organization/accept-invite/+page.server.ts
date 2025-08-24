import { auth } from "$lib/auth";
import { Parsers } from "$lib/schema/parsers";
import { error } from "@sveltejs/kit";
import type { User } from "better-auth";
import type { Invitation, Member, Organization } from "better-auth/plugins";
import z from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request, url }) => {
  const search = Parsers.url(
    url,
    z.object({ invite_id: z.string().min(1, "Invite ID is required") }),
  );

  const ctx = await auth.$context;

  const [session, invitation] = await Promise.all([
    auth.api.getSession({ headers: request.headers }),

    ctx.adapter.findOne<
      Pick<
        Invitation,
        "id" | "email" | "organizationId" | "inviterId" | "expiresAt" | "status"
      >
    >({
      model: "invitation",
      where: [{ field: "id", value: search.invite_id }],
      select: [
        "id",
        "email",
        "organizationId",
        "inviterId",
        "expiresAt",
        "status",
      ],
    }),
  ]);

  if (!session) {
    return {
      search,
      prompt: "signup_login" as const,
    };
  } else if (!invitation) {
    return {
      search,
      session,
      prompt: "invalid_invite_id" as const,
    };
  } else if (invitation.email !== session.user.email) {
    return {
      search,
      session,
      inviter: null,
      invitation: null,
      organization: null,
      prompt: "wrong_account" as const,
    };
  } else if (invitation.status !== "pending") {
    return {
      search,
      session,
      invitation,
      prompt: "invite_not_pending" as const,
    };
  } else if (invitation.expiresAt < new Date()) {
    return {
      search,
      session,
      invitation,
      prompt: "invite_expired" as const,
    };
  }

  const [organization, inviter, member] = await Promise.all([
    ctx.adapter.findOne<Pick<Organization, "name">>({
      model: "organization",
      select: ["name"],
      where: [
        {
          field: "id",
          value: invitation.organizationId,
        },
      ],
    }),

    ctx.adapter.findOne<Pick<User, "name" | "email">>({
      model: "user",
      select: ["name", "email"],
      where: [
        {
          field: "id",
          value: invitation.inviterId,
        },
      ],
    }),

    ctx.adapter.findOne<Pick<Member, "id">>({
      model: "member",
      select: ["id"],
      where: [
        {
          field: "userId",
          value: session.user.id,
        },
        {
          field: "organizationId",
          value: invitation.organizationId,
        },
      ],
    }),
  ]);

  if (!organization) {
    error(400, "Invalid invitation: organization does not exist");
  } else if (!inviter) {
    error(400, "Invalid invitation: inviter does not exist");
  } else if (member) {
    return {
      search,
      session,
      inviter,
      invitation,
      organization,
      prompt: "already_member" as const,
    };
  } else {
    return {
      search,
      session,
      inviter,
      invitation,
      organization,
      prompt: "accept_invite" as const,
    };
  }
};
