import { goto } from "$app/navigation";
import { page } from "$app/state";
import { BetterAuthClient } from "$lib/auth-client";
import { App } from "$lib/utils/app";
import { toast } from "svelte-sonner";
import { getFlash } from "sveltekit-flash-message";
import { Client } from "../index.client";

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
      suc_msg:
        "Account deletion requested. Please check your email to confirm.",
      confirm:
        "Are you sure you want to delete your account? We will send an email to confirm. This action is irreversible.",
    },
  ),

  signout: async () => {
    await BetterAuthClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.info("You have been signed out.");
          return goto("/auth/signin");
        },
        onError: (error) => {
          console.error("Error signing out:", error);
          location.reload();
        },
      },
    });

    getFlash(page).set({
      level: "success",
      message: "You have been signed out.",
    });
  },
};
