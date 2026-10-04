import { BetterAuthClient } from "#lib/auth-client.js";
import {
  delete_passkey_remote,
  list_passkeys_remote,
} from "#lib/remote/auth/passkey.remote.js";
import { BetterAuth } from "#lib/utils/better-auth.util.js";
import { result } from "#lib/utils/result.util.js";
import { Client } from "../index.client.js";

export const PasskeyClient = {
  create: Client.wrap(
    async (
      input: Parameters<typeof BetterAuthClient.passkey.addPasskey>[0],
    ) => {
      // The Better-Auth client answers `{ error }` rather than throwing, and
      // `Client.wrap` already catches and files anything unexpected.
      const res = await BetterAuth.to_result(
        BetterAuthClient.passkey.addPasskey(input),
      );
      if (!res.ok) {
        return result.err({
          status: res.error.status,
          message:
            res.error.message ?? "Adding passkey failed. Please try again.",
        });
      }

      await list_passkeys_remote().refresh();

      return res;
    },
    { suc_msg: "Passkey added" },
  ),

  delete: Client.wrap(
    (passkey_id: string) =>
      delete_passkey_remote(passkey_id).updates(
        list_passkeys_remote().withOverride((cur) =>
          result.pipe(cur, (d) => d.filter((p) => p.id !== passkey_id)),
        ),
      ),
    {
      confirm:
        "Delete this passkey? You won't be able to sign in with it again.",
      destructive: true,
      action_label: "Delete passkey",
      suc_msg: "Passkey deleted",
    },
  ),
};
