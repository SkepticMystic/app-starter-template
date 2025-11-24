import type { ResolvedPathname } from "$app/types";
import { BetterAuthClient } from "$lib/auth-client";
import { BetterAuth } from "$lib/utils/better-auth.util";
import { err } from "$lib/utils/result.util";
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
        if (!email) return err({ message: "Email is required" });

        return BetterAuth.to_result(
          BetterAuthClient.sendVerificationEmail({ email, ...options }),
        );
      },
      {
        validate_session: false,
        toast: { success: "Verification email sent" },
      },
    ),

  delete: () =>
    Client.better_auth(() => BetterAuthClient.deleteUser(), {
      confirm: "Are you sure you want to delete your account?",
      toast: { success: "Account deleted successfully" },
    }),
};
