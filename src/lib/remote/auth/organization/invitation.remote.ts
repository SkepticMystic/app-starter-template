import { command, form, getRequestEvent, query } from "$app/server";
import { auth, is_ba_error_code } from "$lib/auth";
import { ORGANIZATION } from "$lib/const/auth/organization.const";
import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { get_session } from "$lib/services/auth.service";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { error, invalid } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import z from "zod";
import { ERROR } from "$lib/const/error.const";

export const get_all_invitations_remote = query(async () => {
  const session = await get_session();

  const invitations = await Repo.query(
    db.query.invitation.findMany({
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
    }),
  );

  if (!invitations.ok) {
    error(invitations.error.status ?? 500, invitations.error.message);
  }

  return invitations.data;
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
          is_ba_error_code(
            error,
            "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION",
            "USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION",
          )
        ) {
          invalid(issue.email(error.message));
        } else if (
          is_ba_error_code(
            error,
            "YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE",
          )
        ) {
          invalid(issue.role(error.message));
        }

        return result.err({ message: error.message });
      } else {
        Log.error(error, "create_invitation_remote.error unknown");

        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
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

        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }
  },
);
