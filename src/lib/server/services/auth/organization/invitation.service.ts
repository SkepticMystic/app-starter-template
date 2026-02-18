import { getRequestEvent } from "$app/server";
import { auth, is_ba_error_code } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import type { InvitationSchema } from "$lib/server/db/models/auth.model";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";
import type { Invitation } from "better-auth/plugins";
import type z from "zod";

const log = Log.child({ service: "Invitation" });

const create = async (
  input: z.output<typeof InvitationSchema.create>,
): Promise<App.Result<Invitation>> => {
  const l = log.child({ method: "create" });

  try {
    const data = await auth.api.createInvitation({
      body: input,
      headers: getRequestEvent().request.headers,
    });

    return result.suc(data);
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      if (
        is_ba_error_code(
          error,
          "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION",
          "USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION",
        )
      ) {
        return result.from_ba_error(error, { path: ["email"] });
      } else if (
        is_ba_error_code(
          error,
          "YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE",
        )
      ) {
        return result.from_ba_error(error, { path: ["role"] });
      } else {
        captureException(error);

        return result.from_ba_error(error);
      }
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const cancel = async (invitation_id: string) => {
  const l = log.child({ method: "cancel" });

  try {
    const res = await auth.api.cancelInvitation({
      body: { invitationId: invitation_id },
      headers: getRequestEvent().request.headers,
    });

    if (!res) {
      l.warn("error no response");

      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to cancel invitation",
      });
    }

    return result.suc();
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      captureException(error);

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const accept = async (invitation_id: string) => {
  const l = log.child({ method: "accept" });

  try {
    const event = getRequestEvent();

    const session = await auth.api.getSession({
      headers: event.request.headers,
    });
    if (!session) {
      return result.err({
        ...ERROR.UNAUTHORIZED,
        message: "Sign in first to accept invitation",
      });
    }

    const res = await auth.api.acceptInvitation({
      body: { invitationId: invitation_id },
      headers: event.request.headers,
    });
    if (!res) {
      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }

    await (
      await auth.$context
    ).internalAdapter.updateSession(session.session.token, {
      member_id: res.member.id,
      member_role: res.member.role,
      org_id: res.invitation.organizationId,
      activeOrganizationId: res.invitation.organizationId,
    });

    return result.suc(res);
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      captureException(error);

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

export const InvitationService = {
  create,
  cancel,
  accept,
};
