import { goto } from "$app/navigation";
import { Toast } from "#lib/utils/toast.util.js";
import { resolve } from "$app/paths";
import { BetterAuthClient } from "#lib/auth-client.js";
import { App } from "#lib/utils/app.js";
import { Client } from "../index.client.js";

export const UserClient = {
  send_verification_email: Client.better_auth(
    (input: Parameters<typeof BetterAuthClient.sendVerificationEmail>[0]) =>
      BetterAuthClient.sendVerificationEmail(input),
    { suc_msg: "Verification email sent" },
  ),

  request_deletion: Client.better_auth(
    () =>
      BetterAuthClient.deleteUser({
        callbackURL: App.url("/auth/account-deleted"),
      }),
    {
      suc_msg: {
        title: "Account deletion requested",
        description: "Check your email to confirm it.",
      },
      confirm:
        "Delete your account? We'll email you a link to confirm it. Once you do, it cannot be undone.",
      destructive: true,
      action_label: "Delete account",
    },
  ),

  signout: async () => {
    await BetterAuthClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          Toast.info("Signed out");
          // `refreshAll`: the root layout's `page.data.user` would otherwise outlive the session.
          return goto(resolve("auth/signin"), { refreshAll: true });
        },
        onError: (error: unknown) => {
          console.error("Error signing out:", error);
          location.reload();
        },
      },
    });
  },
};
