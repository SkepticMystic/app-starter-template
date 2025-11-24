import { BetterAuthClient } from "$lib/auth-client";
import {
  delete_passkey_remote,
  get_all_passkeys_remote,
} from "$lib/remote/auth/passkey.remote";
import { err, result, suc } from "$lib/utils/result.util";
import { Client } from "./index.client";

export const PasskeysClient = {
  create: (name?: string) =>
    Client.request(
      async () => {
        // NOTE: Can't use BetterAuth.to_result, because it returns an inconsistent shape to the rest of the client api
        const res = await BetterAuthClient.passkey.addPasskey({ name });

        if (!res) {
          // NOTE: This seems to be the _success_ case for some reason????
          console.warn("No response from addPasskey");

          await get_all_passkeys_remote().refresh();

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

  delete: (passkey_id: string) =>
    Client.request(
      () =>
        delete_passkey_remote(passkey_id).updates(
          get_all_passkeys_remote().withOverride((cur) =>
            result.pipe(cur, (d) => d.filter((p) => p.id !== passkey_id)),
          ),
        ),
      {
        confirm: "Are you sure you want to delete this passkey?",
        toast: { optimistic: true, success: "Passkey deleted successfully" },
      },
    ),
};
