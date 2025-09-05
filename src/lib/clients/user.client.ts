import { BetterAuthClient } from "$lib/auth-client";
import { Client } from "./index.client";

export const UserClient = {
  delete: () =>
    Client.better_auth(() => BetterAuthClient.deleteUser(), {
      confirm: "Are you sure you want to delete your account?",
      toast: { success: "Account deleted successfully" },
    }),
};
