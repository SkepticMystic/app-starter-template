import { BetterAuthClient } from "#lib/auth-client.js";
import { ERROR } from "#lib/const/error.const.js";
import {
  delete_passkey_remote,
  list_passkeys_remote,
} from "#lib/remote/auth/passkey.remote.js";
import { BetterAuth } from "#lib/utils/better-auth.util.js";
import { result } from "#lib/utils/result.util.js";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";
import { Client } from "../index.client";

export const PasskeyClient = {
  create: Client.wrap(
    async (
      input: Parameters<typeof BetterAuthClient.passkey.addPasskey>[0],
    ) => {
      try {
        const res = await BetterAuth.to_result(
          BetterAuthClient.passkey.addPasskey(input),
        );

        if (!res.ok) {
          console.warn("res.error", res.error);
          return result.err({
            status: res.error.status,
            message:
              res.error.message ?? "Adding passkey failed. Please try again.",
          });
        }

        await list_passkeys_remote().refresh();

        return result.suc(res.data);
      } catch (error) {
        if (error instanceof APIError) {
          console.info(error.body, "add_passkey_remote.error better-auth");

          captureException(error);

          return result.from_ba_error(error);
        } else {
          console.error(error, "add_passkey_remote.error unknown");

          captureException(error);

          return result.err({
            ...ERROR.INTERNAL_SERVER_ERROR,
            message: "Failed to add passkey",
          });
        }
      }
    },
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
    },
  ),
};
