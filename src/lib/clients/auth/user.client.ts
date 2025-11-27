import type { ResolvedPathname } from "$app/types";
import { BetterAuthClient } from "$lib/auth-client";
import { App } from "$lib/utils/app";
import { BetterAuth } from "$lib/utils/better-auth.util";
import { result } from "$lib/utils/result.util";
import { Client } from "../index.client";

export const UserClient = {
  send_verification_email: (
    email: string | undefined,
    options: {
      callbackURL?: ResolvedPathname;
    } = {
      callbackURL: "/",
    },
  ) =>
    Client.request(
      async () => {
        if (!email) {
          return result.err({ message: "Email is required" });
        }

        return BetterAuth.to_result(BetterAuthClient.sendVerificationEmail({ email, ...options }));
      },
      {
        validate_session: false,
        toast: { success: "Verification email sent" },
      },
    ),

  request_deletion: () =>
    Client.better_auth(
      () =>
        BetterAuthClient.deleteUser({
          callbackURL: App.url("/auth/account-deleted"),
        }),
      {
        confirm:
          "Are you sure you want to delete your account? We will send an email to confirm. This action is irreversible.",
        toast: {
          success: "Account deletion requested. Please check your email to confirm.",
        },
      },
    ),
};
