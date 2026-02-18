import { auth } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { APIError, type Session } from "better-auth";

const log = Log.child({ service: "Session" });

/** Patch the given session with a partial update.
 * Uses internal BA adapter (which is stable, just has "god-mode")
 *
 * @returns session - BA session, not necessarily our overridden shape (not sure)
 */
const patch = async (
  patch: Partial<App.Session["session"]>,
  session: App.Session,
): Promise<App.Result<Session>> => {
  const l = log.child({ method: "patch" });

  try {
    const res = await (
      await auth.$context
    ).internalAdapter.updateSession(session.session.token, patch);

    if (!res) {
      l.warn("error no response");

      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to patch session",
      });
    }

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

export const SessionService = {
  patch,
};
