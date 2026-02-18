import { command, getRequestEvent, query } from "$app/server";
import { auth, is_ba_error_code } from "$lib/auth";
import { AUTH } from "$lib/const/auth/auth.const";
import { ERROR } from "$lib/const/error.const";
import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { safe_get_session } from "$lib/server/services/auth.service";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { error } from "@sveltejs/kit";
import { APIError } from "better-auth";
import z from "zod";

export const get_account_by_provider_id_remote = query.batch(
  z.enum(AUTH.PROVIDERS.IDS),
  async (provider_ids) => {
    const session = await safe_get_session();
    if (!session) return () => undefined;

    const accounts = await Repo.query(
      db.query.account.findMany({
        where: {
          userId: session.user.id,
          providerId: { in: provider_ids },
        },
      }),
    );

    if (!accounts.ok) {
      error(accounts.error.status ?? 500, accounts.error.message);
    }

    const map = new Map(accounts.data.map((a) => [a.providerId, a]));

    return (provider_id) => map.get(provider_id);
  },
);

export const list_accounts_remote = query(async () => {
  try {
    const accounts = await auth.api.listUserAccounts({
      headers: getRequestEvent().request.headers,
    });

    return result.suc(accounts);
  } catch (error) {
    if (error instanceof APIError) {
      Log.info(error.body, "list_accounts_remote.error better-auth");

      captureException(error);

      return result.from_ba_error(error);
    } else {
      Log.error(error, "list_accounts_remote.error");

      captureException(error);

      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to get accounts",
      });
    }
  }
});

export const unlink_account_remote = command(
  z.object({
    accountId: z.string().optional(),
    providerId: z.enum(AUTH.PROVIDERS.IDS),
  }),
  async (input) => {
    try {
      const res = await auth.api.unlinkAccount({
        headers: getRequestEvent().request.headers,
        body: {
          accountId: input.accountId,
          providerId: input.providerId,
        },
      });

      if (res.status) {
        get_account_by_provider_id_remote(input.providerId).set(undefined);

        return result.suc();
      } else {
        return result.err({ message: "Failed to unlink account" });
      }
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "unlink_account_remote.error better-auth");

        if (is_ba_error_code(error, "FAILED_TO_UNLINK_LAST_ACCOUNT")) {
          return result.from_ba_error(error, { path: ["providerId"] });
        } else {
          captureException(error);

          return result.from_ba_error(error);
        }
      } else {
        Log.error(error, "unlink_account_remote.error");

        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }
  },
);
