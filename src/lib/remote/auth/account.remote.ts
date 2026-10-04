import { AUTH } from "#lib/const/auth/auth.const.js";
import { db } from "#lib/server/db/drizzle.db.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import {
  guarded_batch,
  guarded_command,
  guarded_query,
  USER,
} from "#lib/server/remote/guarded.js";
import { AccountService } from "#lib/server/services/auth/account/account.service.js";
import { result } from "#lib/utils/result.util.js";
import { z } from "zod";

export const get_account_by_provider_id_remote = guarded_batch(
  USER,
  z.enum(AUTH.PROVIDERS.IDS),
  async (provider_ids, { user_id }) => {
    // Columns are listed because the `credential` row holds the password hash
    // and OAuth rows hold access and refresh tokens; none may reach a browser.
    const accounts = await Repo.query(
      db.query.account.findMany({
        columns: {
          id: true,
          providerId: true,
          accountId: true,
          createdAt: true,
        },
        where: { userId: user_id, providerId: { in: provider_ids } },
      }),
    );

    if (!accounts.ok) return () => accounts;

    const map = new Map(accounts.data.map((a) => [a.providerId, a]));

    return (provider_id) => result.suc(map.get(provider_id) ?? null);
  },
);

export const list_accounts_remote = guarded_query(USER, async ({ session }) =>
  AccountService.list(session),
);

export const unlink_account_remote = guarded_command(
  USER,
  z.object({
    // The `account` row id — what Better-Auth unlinks by. `providerId` is only
    // here to name the query cache entry to reset below.
    id: z.uuid(),
    providerId: z.enum(AUTH.PROVIDERS.IDS),
  }),
  async (input, { session }) => {
    const res = await AccountService.unlink({ id: input.id }, session);

    if (res.ok) {
      get_account_by_provider_id_remote(input.providerId).set(result.suc(null));
    }

    return res;
  },
);
