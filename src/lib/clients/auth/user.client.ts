import { BetterAuthClient } from "$lib/auth-client";
import { App } from "$lib/utils/app";
import { Client } from "../index.client";

export const UserClient = {
  send_verification_email: Client.better_auth(
    (input: Parameters<typeof BetterAuthClient.sendVerificationEmail>[0]) =>
      BetterAuthClient.sendVerificationEmail(input),
    {
      validate_session: false,
      suc_msg: "Verification email sent",
    },
  ),

  request_deletion: Client.better_auth(
    () =>
      BetterAuthClient.deleteUser({
        callbackURL: App.url("/auth/account-deleted"),
      }),
    {
      suc_msg:
        "Account deletion requested. Please check your email to confirm.",
      confirm:
        "Are you sure you want to delete your account? We will send an email to confirm. This action is irreversible.",
    },
  ),
};
