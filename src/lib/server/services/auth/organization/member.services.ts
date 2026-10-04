import { getRequestEvent } from "$app/server";
import { auth, is_ba_error_code } from "#lib/auth.js";
import type { IOrganization } from "#lib/const/auth/organization.const.js";
import { ERROR } from "#lib/const/error.const.js";
import { ServiceUtil } from "#lib/server/services/service.util.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";

const log = Log.child({ service: "Member" });

const remove = async (member_id: string) => {
  const l = log.child({ method: "remove" });

  try {
    const res = await auth.api.removeMember({
      body: { memberIdOrEmail: member_id },
      headers: getRequestEvent().request.headers,
    });

    if (!res) {
      l.warn("error no response");

      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to remove member",
      });
    }

    return result.suc(undefined);
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      /**
       * Leaving as the only owner is a user mistake, not a fault worth
       * reporting. Written as one negated guard so that intent is visible —
       * the two branches were otherwise identical apart from the capture,
       * which read as an oversight.
       */
      if (
        !is_ba_error_code(
          error,
          "YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER",
        )
      ) {
        captureException(error);
      }

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

/**
 * Answers what the members table patches. `afterUpdateMemberRole` in
 * `auth.ts` rewrites the member's stored sessions to match.
 */
const update_role = async (input: {
  org_id: string;
  member_id: string;
  role: IOrganization.RoleId;
}): Promise<App.Result<{ id: string; role: IOrganization.RoleId }>> => {
  try {
    await auth.api.updateMemberRole({
      body: {
        organizationId: input.org_id,
        memberId: input.member_id,
        role: input.role,
      },
      headers: getRequestEvent().request.headers,
    });

    return result.suc({ id: input.member_id, role: input.role });
  } catch (error) {
    return ServiceUtil.ba_error(error, {
      log: log.child({ method: "update_role" }),
    });
  }
};

export const MemberService = {
  remove,
  update_role,
};
