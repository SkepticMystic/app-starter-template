import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db/drizzle.db";
import { InvitationTable } from "$lib/server/db/models/auth.model";
import { Repo } from "$lib/server/db/repos/index.repo";
import { operators } from "drizzle-orm";
import { ServiceUtil } from "$lib/server/services/service.util";
import { auth, is_ba_error_code } from "$lib/auth";
import type { IOrganization } from "$lib/const/auth/organization.const";
import { ERROR } from "$lib/const/error.const";
import type { InvitationSchema } from "$lib/server/db/models/auth.model";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";
import type { Invitation } from "better-auth/plugins";
import type { z } from "zod";

const log = Log.child({ service: "Invitation" });

const create = async (
  input: z.output<typeof InvitationSchema.create>,
): Promise<App.Result<Invitation & { role: IOrganization.RoleId }>> => {
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

    return result.suc(undefined);
  } catch (error) {
    return ServiceUtil.ba_error(error, { log: l });
  }
};

const accept = async (invitation_id: string) => {
  const l = log.child({ method: "accept" });

  try {
    const event = getRequestEvent();

    // TODO: What happens if I don't have a session?
    // Check what BA does if I'm not logged in
    const session = await auth.api.getSession({
      headers: event.request.headers,
    });
    if (!session) {
      return result.err({
        ...ERROR.UNAUTHORIZED,
        message: "Sign in first to accept invitation",
      });
    }

    // BA's acceptInvitation calls setActiveOrganization internally, which
    // fires our session.update databaseHook to populate org_id, member_id,
    // member_role, and active_plan.
    const res = await auth.api.acceptInvitation({
      body: { invitationId: invitation_id },
      headers: event.request.headers,
    });
    if (!res) {
      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }

    return result.suc(res);
  } catch (error) {
    return ServiceUtil.ba_error(error, { log: l });
  }
};

/**
 * Close an invitation whose recipient is already a member.
 *
 * There is no path through Better-Auth that does this. `acceptInvitation` is
 * the only thing that moves an invitation out of `pending`, and the person
 * cannot accept — they are already in the organization, so the accept page
 * shows them the door rather than the button. The row then sits in the
 * inviter's table as an outstanding invite forever.
 *
 * Written as `accepted` rather than `canceled`: cancelled reads as an admin
 * having withdrawn it, which nobody did. Guarded on `status = 'pending'` so it
 * is idempotent and two tabs race harmlessly.
 *
 * Failure is logged at `warn` and deliberately not surfaced: the caller is a
 * page load whose job is to tell somebody they are already a member, and it can
 * do that either way.
 */
const settle_for_existing_member = async (invitation_id: string) => {
  const res = await Repo.update_applied(
    db
      .update(InvitationTable)
      .set({ status: "accepted" })
      .where(
        operators.and(
          operators.eq(InvitationTable.id, invitation_id),
          operators.eq(InvitationTable.status, "pending"),
        ),
      )
      .returning({ id: InvitationTable.id }),
  );

  if (!res.ok) {
    log.warn(res.error, "settle_for_existing_member.error");
  }

  return res;
};

export const InvitationService = {
  create,
  cancel,
  accept,
  settle_for_existing_member,
};
