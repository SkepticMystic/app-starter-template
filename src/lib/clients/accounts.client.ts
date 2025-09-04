import { BetterAuthClient } from "$lib/auth-client";
import type { IAuth } from "$lib/const/auth.const";
import { err, suc } from "$lib/utils/result.util";
import { Client } from "./index.client";

export const AccountsClient = {
  unlink: async (provider_id: IAuth.ProviderId, account_id?: string) =>
    Client.request(
      async () => {
        if (!confirm("Are you sure you want to unlink this account?")) {
          return err();
        }

        const res = await BetterAuthClient.unlinkAccount({
          accountId: account_id,
          providerId: provider_id,
        });

        if (res.data) {
          return suc(res.data);
        } else {
          return err({
            message: res.error.message ?? "Failed to unlink account",
          });
        }
      },
      {
        toast: {
          loading: "Unlinking account...",
          success: "Account unlinked successfully",
        },
      },
    ),
};
