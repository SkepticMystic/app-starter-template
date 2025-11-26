import { command, form, getRequestEvent, query } from "$app/server";
import { auth } from "$lib/auth";
import { get_session } from "$lib/auth/server";
import { ORGANIZATION } from "$lib/const/organization.const";
import { db } from "$lib/server/db/drizzle.db";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { invalid } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import z from "zod";

export const get_all_invitations_remote = query(async () => {
  const session = await get_session();

  const invitations = await db.query.invitation.findMany({
    where: (invitation, { eq }) =>
      eq(invitation.organizationId, session.session.org_id),

    orderBy: (invitation, { desc }) => [desc(invitation.createdAt)],

    columns: {
      id: true,
      role: true,
      email: true,
      status: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return invitations;
});

export const create_invitation_remote = form(
  z.object({
    email: z.email("Please enter a valid email address"),
    role: z.enum(ORGANIZATION.ROLES.IDS).default("member"),
  }),
  async (input, issue) => {
    try {
      const data = await auth.api.createInvitation({
        body: input,
        headers: getRequestEvent().request.headers,
      });

      return result.suc(data);
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "create_invitation_remote.error better-auth");

        if (
          error.body?.code ===
            auth.$ERROR_CODES.USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION ||
          error.body?.code ===
            auth.$ERROR_CODES.USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION
        ) {
          invalid(issue.email(error.message));
        }

        return result.err({ message: error.message });
      } else {
        Log.error(error, "create_invitation_remote.error unknown");

        return result.err({ message: "Internal server error" });
      }
    }
  },
);

export const cancel_invitation_remote = command(
  z.uuid(), //
  async (invitation_id) => {
    try {
      const res = await auth.api.cancelInvitation({
        body: { invitationId: invitation_id },
        headers: getRequestEvent().request.headers,
      });

      return res
        ? result.suc()
        : result.err({ message: "Failed to cancel invitation" });
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "cancel_invitation_remote.error better-auth");

        return result.err({ message: error.message });
      } else {
        Log.error(error, "cancel_invitation_remote.error unknown");

        return result.err({ message: "Internal server error" });
      }
    }
  },
);
