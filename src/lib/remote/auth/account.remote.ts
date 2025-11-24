import { command, getRequestEvent, query } from "$app/server";
import { auth } from "$lib/auth";
import { get_session } from "$lib/auth/server";
import { AUTH, type IAuth } from "$lib/const/auth.const";
import { db } from "$lib/server/db/drizzle.db";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { APIError } from "better-auth";
import z from "zod";

export const get_account_by_provider_id_remote = query.batch(
  z.enum(AUTH.PROVIDERS.IDS),
  async (provider_ids) => {
    const session = await get_session();

    const accounts = await db.query.account.findMany({
      where: (account, { and, eq, inArray }) =>
        and(
          eq(account.userId, session.user.id),
          inArray(account.providerId, provider_ids),
        ),
    });

    const map = new Map(accounts.map((a) => [a.providerId, a]));

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

    return result.err({ message: "Failed to get accounts" });
  }
});

export const unlink_account_remote = command(
  z.object({
    providerId: z.string(),
    accountId: z.string().optional(),
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
        get_account_by_provider_id_remote(
          input.providerId as IAuth.ProviderId,
        ).set(undefined);

        return result.suc({ message: "Account unlinked successfully" });
      } else {
        return result.err({ message: "Failed to unlink account" });
      }
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error, "unlink_account_remote.error better-auth");

        return result.err({ message: error.message });
      } else {
        Log.error(error, "unlink_account_remote.error");

        return result.err({ message: "Internal server error" });
      }
    }
  },
);
