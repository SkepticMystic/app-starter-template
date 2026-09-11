import { getRequestEvent } from "$app/server";
import { auth, is_ba_error_code } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { ServiceUtil } from "$lib/server/services/service.util";
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
    return ServiceUtil.ba_error(error, {
      log: l,
      message: "Failed to get accounts",
    });
  }
};

/**
 * Better-Auth unlinks by the `account` row id, and since 1.7 that is the only
 * thing `unlinkAccount` accepts. The old `{ accountId?, providerId }` pair was
 * both wrong and optional — omitting `accountId` silently unlinked nothing.
 * `providerId` survives only so the caller can name the query cache entry to
 * reset.
 */
const unlink = async (
  input: { id: string },
  _session: App.Session,
): Promise<App.Result<undefined>> => {
  const l = log.child({ method: "unlink" });

  try {
    const res = await auth.api.unlinkAccount({
      headers: getRequestEvent().request.headers,
      body: { accountId: input.id },
    });

    if (res.status) {
      return result.suc(undefined);
    } else {
      return result.err({ message: "Failed to unlink account" });
    }
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      // Refusing to unlink the last account is Better-Auth answering, not a
      // fault worth filing.
      if (!is_ba_error_code(error, "FAILED_TO_UNLINK_LAST_ACCOUNT")) {
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

export const AccountService = { list, unlink };
