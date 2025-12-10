import { BetterAuthClient } from "$lib/auth-client";
import {
  delete_passkey_remote,
  get_all_passkeys_remote,
} from "$lib/remote/auth/passkey.remote";
import { result } from "$lib/utils/result.util";
import { Client } from "../index.client";

export const PasskeyClient = {
  create: Client.wrap(
    async (
      input: Parameters<typeof BetterAuthClient.passkey.addPasskey>[0],
    ) => {
      // NOTE: Can't use BetterAuth.to_result, because it returns an inconsistent shape to the rest of the client api
      const res = await BetterAuthClient.passkey.addPasskey(input);

      if (!res) {
        // NOTE: This seems to be the _success_ case for some reason????
        console.warn("No response from addPasskey");

        await get_all_passkeys_remote().refresh();

        return result.suc(null);
      } else if (res.error) {
        console.warn("res.error", res.error);
        return result.err({
          message:
            res.error.message ?? "Adding passkey failed. Please try again.",
        });
      } else {
        console.log("res.data", res.data);
        return result.suc(res.data);
      }
    },
  ),

  delete: Client.wrap(
    (passkey_id: string) =>
      delete_passkey_remote(passkey_id).updates(
        get_all_passkeys_remote().withOverride((cur) =>
          result.pipe(cur, (d) => d.filter((p) => p.id !== passkey_id)),
        ),
      ),
    {
      optimistic: true,
      confirm: "Are you sure you want to delete this passkey?",
    },
  ),
};
