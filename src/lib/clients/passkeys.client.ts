import { BetterAuthClient } from "$lib/auth-client";
import { err, suc } from "$lib/utils/result.util";
import type { Passkey } from "better-auth/plugins/passkey";
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
          return err({
            message:
              res.error.message ?? "Adding passkey failed. Please try again.",
          });
        } else {
          console.log("res.data", res.data);
          return suc(res.data);
        }
      },
      {
        toast: {
          loading: "Adding passkey...",
          success: "Passkey added successfully",
        },
      },
    ),

  update: (passkey_id: string, passkey: Pick<Passkey, "name">) =>
    Client.request(
      async () => {
        if (!passkey.name) {
          return err({
            message: "Passkey name cannot be empty",
          });
        }

        const res = await BetterAuthClient.passkey.updatePasskey({
          id: passkey_id,
          name: passkey.name,
        });

        if (res.error) {
          return err({
            message: res.error.message ?? "Failed to update passkey",
          });
        } else {
          return suc(res.data.passkey);
        }
      },
      {
        toast: {
          optimistic: true,
          success: "Passkey updated successfully",
        },
      },
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
          return err({
            message: res.error.message ?? "Failed to delete passkey",
          });
        } else {
          return suc(res.data);
        }
      },
      {
        toast: {
          loading: "Deleting passkey...",
          success: "Passkey deleted successfully",
        },
      },
    ),
};
