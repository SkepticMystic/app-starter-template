import { command, getRequestEvent, query } from "$app/server";
import type { ResolvedPathname } from "$app/types";
import { auth, is_ba_error_code } from "$lib/auth";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { error } from "@sveltejs/kit";
import { APIError } from "better-auth";
import { redirect } from "sveltekit-flash-message/server";
import z from "zod";
import { ERROR } from "$lib/const/error.const";

export const get_all_members_remote = query(async () => {
  try {
    const members = await auth.api.listMembers({
      headers: getRequestEvent().request.headers,
    });

    return members.members;
  } catch (e) {
    if (e instanceof APIError) {
      Log.info(e, "get_all_members_remote.error better-auth");

      // NOTE: This seems to happen when they're not logged in... bad error code
      if (is_ba_error_code(e, "YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION")) {
        redirect(
          302,
          "/auth/signin" satisfies ResolvedPathname,
          { level: "warning", message: "Signin to continue" },
          getRequestEvent(),
        );
      }

      error(400, { message: e.message });
    } else {
      Log.error(e, "get_all_members_remote.error unknown");

      captureException(e);

      error(500, { message: "Internal server error" });
    }
  }
});

export const remove_member_remote = command(
  z.uuid(), // NOTE: member_email is allowed by BA, but we enforce member_id for the optimistic update on the client
  async (member_id) => {
    try {
      const res = await auth.api.removeMember({
        body: { memberIdOrEmail: member_id },
        headers: getRequestEvent().request.headers,
      });

      return res
        ? result.suc()
        : result.err({ message: "Failed to remove member" });
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "remove_member_remote.error better-auth");

        return result.err({ message: error.message });
      } else {
        Log.error(error, "remove_member_remote.error unknown");

        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }
  },
);
