import { getRequestEvent } from "$app/server";
import { auth, is_ba_error_code } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";

const log = Log.child({ service: "Account" });

const list = async (
  _session: App.Session,
): Promise<
  App.Result<Awaited<ReturnType<typeof auth.api.listUserAccounts>>>
> => {
  const l = log.child({ method: "list" });

  try {
    const accounts = await auth.api.listUserAccounts({
      headers: getRequestEvent().request.headers,
    });

    return result.suc(accounts);
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      captureException(error);

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to get accounts",
      });
    }
  }
};

const unlink = async (
  input: { accountId?: string; providerId: string },
  _session: App.Session,
): Promise<App.Result<undefined>> => {
  const l = log.child({ method: "unlink" });

  try {
    const res = await auth.api.unlinkAccount({
      headers: getRequestEvent().request.headers,
      body: {
        accountId: input.accountId,
        providerId: input.providerId,
      },
    });

    if (res.status) {
      return result.suc();
    } else {
      return result.err({ message: "Failed to unlink account" });
    }
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      if (is_ba_error_code(error, "FAILED_TO_UNLINK_LAST_ACCOUNT")) {
        return result.from_ba_error(error, { path: ["providerId"] });
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

export const AccountService = { list, unlink };
