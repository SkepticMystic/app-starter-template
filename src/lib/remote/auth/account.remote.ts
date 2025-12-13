import { command, getRequestEvent, query } from "$app/server";
import { auth } from "$lib/auth";
import { AUTH } from "$lib/const/auth/auth.const";
import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { get_session } from "$lib/services/auth.service";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { error } from "@sveltejs/kit";
import { APIError } from "better-auth";
import z from "zod";
import { ERROR } from "$lib/const/error.const";

export const get_account_by_provider_id_remote = query.batch(
  z.enum(AUTH.PROVIDERS.IDS),
  async (provider_ids) => {
    const session = await get_session();

    const accounts = await Repo.query(
      db.query.account.findMany({
        where: (account, { and, eq, inArray }) =>
          and(
            eq(account.userId, session.user.id), //
            inArray(account.providerId, provider_ids),
          ),
      }),
    );

    if (!accounts.ok) {
      error(accounts.error.status ?? 500, accounts.error.message);
    }

    const map = new Map(accounts.data.map((a) => [a.providerId, a]));

    return (provider_id) => map.get(provider_id);
  },
);

export const get_all_accounts_remote = query(async () => {
  try {
    const accounts = await auth.api.listUserAccounts({
      headers: getRequestEvent().request.headers,
    });

    return result.suc(accounts);
  } catch (error) {
    Log.error(error, "get_all_accounts_remote.error");

    captureException(error);

    return result.err({ message: "Failed to get accounts" });
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
          providerId: input.providerId,
          accountId: input.accountId,
        },
      });

      if (res.status) {
        get_account_by_provider_id_remote(input.providerId).set(undefined);

        return result.suc({ message: "Account unlinked successfully" });
      } else {
        return result.err({ message: "Failed to unlink account" });
      }
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "unlink_account_remote.error better-auth");

        return result.err({ message: error.message });
      } else {
        Log.error(error, "unlink_account_remote.error");

        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }
  },
);
