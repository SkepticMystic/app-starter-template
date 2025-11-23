import { BetterAuthClient } from "$lib/auth-client";
import { BetterAuth } from "$lib/utils/better-auth.util";
import { err, suc } from "$lib/utils/result.util";
import { Client } from "./index.client";
import type { Passkey } from "$lib/server/db/schema/auth.models";

export const PasskeysClient = {
  create: (name?: string) =>
    Client.request(
      async () => {
        // NOTE: Can't use BetterAuth.to_result, because it returns an inconsistent shape to the rest of the client api
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
      { toast: { success: "Passkey added successfully" } },
    ),

  update: (passkey_id: string, passkey: Pick<Passkey, "name">) =>
    Client.request(
      async () => {
        if (!passkey.name) {
          return err({ message: "Passkey name cannot be empty" });
        }

        return BetterAuth.to_result(
          BetterAuthClient.passkey.updatePasskey({
            id: passkey_id,
            name: passkey.name,
          }),
        );
      },
      { toast: { optimistic: true, success: "Passkey updated successfully" } },
    ),

  delete: (passkey_id: string) =>
    Client.better_auth(
      () => BetterAuthClient.passkey.deletePasskey({ id: passkey_id }),
      {
        confirm: "Are you sure you want to delete this passkey?",
        toast: { success: "Passkey deleted successfully" },
      },
    ),
};
