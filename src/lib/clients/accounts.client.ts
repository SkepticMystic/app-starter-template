import { BetterAuthClient } from "$lib/auth-client";
import type { IAuth } from "$lib/const/auth.const";
import type { AuthSchema } from "$lib/schema/auth.schema";
import type { Infer } from "sveltekit-superforms";
import { Client } from "./index.client";

export const AccountsClient = {
  unlink: async (input: { providerId: IAuth.ProviderId; accountId?: string }) =>
    Client.better_auth(() => BetterAuthClient.unlinkAccount(input), {
      confirm: "Are you sure you want to unlink this account?",
      toast: { success: "Account unlinked successfully" },
    }),

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
