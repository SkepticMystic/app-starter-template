import { getRequestEvent } from "$app/server";
import { auth } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
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

export const MemberService = {
  remove,
};
