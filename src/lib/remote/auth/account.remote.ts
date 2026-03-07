import { command, query } from "$app/server";
import { AUTH } from "$lib/const/auth/auth.const";
import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { get_session } from "$lib/server/services/auth.service";
import { AccountService } from "$lib/server/services/auth/account/account.service";
import { error } from "@sveltejs/kit";
import z from "zod";

export const get_account_by_provider_id_remote = query.batch(
  z.enum(AUTH.PROVIDERS.IDS),
  async (provider_ids) => {
    const session = await get_session();
    if (!session.ok) return () => undefined;

    const accounts = await Repo.query(
      db.query.account.findMany({
        where: {
          userId: session.data.user.id,
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
  const session = await get_session();
  if (!session.ok) return session;
  return AccountService.list(session.data);
});

export const unlink_account_remote = command(
  z.object({
    accountId: z.string().optional(),
    providerId: z.enum(AUTH.PROVIDERS.IDS),
  }),
  async (input) => {
    const session = await get_session();
    if (!session.ok) return session;

    const res = await AccountService.unlink(input, session.data);

    if (res.ok) {
      get_account_by_provider_id_remote(input.providerId).set(undefined);
    }

    return res;
  },
);
