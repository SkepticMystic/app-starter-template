import { BetterAuthClient } from "$lib/auth-client";
import type { IAuth } from "$lib/const/auth.const";
import type { AuthSchema } from "$lib/schema/auth.schema";
import type { Infer } from "sveltekit-superforms";
import { Client } from "./index.client";

export const AccountsClient = {
  unlink: async (provider_id: IAuth.ProviderId, account_id?: string) =>
    Client.better_auth(
      () =>
        BetterAuthClient.unlinkAccount({
          accountId: account_id,
          providerId: provider_id,
        }),
      {
        confirm: "Are you sure you want to unlink this account?",
        toast: { success: "Account unlinked successfully" },
      },
    ),

  change_password: (input: Infer<typeof AuthSchema.change_password_form>) =>
    Client.better_auth(
      () =>
        BetterAuthClient.changePassword({
          newPassword: input.new_password,
          currentPassword: input.current_password,
        }),
      {
        confirm: "Are you sure you want to change your password?",
        toast: { success: "Password changed successfully" },
      },
    ),
};
