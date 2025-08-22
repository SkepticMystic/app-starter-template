import { BetterAuthClient } from "$lib/auth-client";
import { err, suc } from "$lib/utils";
import { Client } from "./index.client";

export const UserClient = {
  delete: async () =>
    Client.request(
      async () => {
        if (!confirm("Are you sure you want to delete your account?")) {
          return err();
        }

        const res = await BetterAuthClient.deleteUser();

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn(res.error);
          return err(
            res.error.message ?? "Failed to delete account. Please try again.",
          );
        }
      },
      { toast: { suc: "Account deleted successfully" } },
    ),
};
