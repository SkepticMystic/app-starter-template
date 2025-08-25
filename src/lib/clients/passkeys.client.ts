import { BetterAuthClient } from "$lib/auth-client";
import { err, suc } from "$lib/utils/result.util";
import { Client } from "./index.client";

export const PasskeysClient = {
  create: (name?: string) =>
    Client.request(
      async () => {
        const res = await BetterAuthClient.passkey.addPasskey({ name });

        if (!res) {
          // NOTE: This seems to be the _success_ case for some reason????
          console.warn("No response from addPasskey");
          return suc(null);
        } else if (res.error) {
          console.warn("res.error", res.error);
          return err(
            res.error.message ?? "Adding passkey failed. Please try again.",
          );
        } else {
          console.log("res.data", res.data);
          return suc(res.data);
        }
      },
      { toast: { suc: "Passkey added successfully" } },
    ),

  delete: (passkey_id: string) =>
    Client.request(
      async () => {
        if (!confirm("Are you sure you want to delete this passkey?")) {
          return err();
        }

        const res = await BetterAuthClient.passkey.deletePasskey({
          id: passkey_id,
        });

        if (res.error) {
          return err(res.error.message ?? "Failed to delete passkey");
        } else {
          return suc();
        }
      },
      { toast: { suc: "Passkey deleted successfully" } },
    ),
};
