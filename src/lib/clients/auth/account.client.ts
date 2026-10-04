import {
  list_accounts_remote,
  unlink_account_remote,
} from "#lib/remote/auth/account.remote.js";
import { Client } from "../index.client.js";

export const AccountClient = {
  unlink: Client.wrap(
    (input: Parameters<typeof unlink_account_remote>[0]) =>
      unlink_account_remote(input).updates(list_accounts_remote()),
    {
      confirm:
        "Unlink this account? It stops being one of your sign-in methods.",
      destructive: true,
      action_label: "Unlink account",
      suc_msg: "Account unlinked",
    },
  ),
};
