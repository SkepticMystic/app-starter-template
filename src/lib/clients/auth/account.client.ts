import {
  get_all_accounts_remote,
  unlink_account_remote,
} from "$lib/remote/auth/account.remote";
import { Client } from "../index.client";

export const AccountClient = {
  unlink: Client.wrap(
    (input: Parameters<typeof unlink_account_remote>[0]) =>
      unlink_account_remote(input).updates(get_all_accounts_remote()),
    {
      confirm: "Are you sure you want to unlink this account?",
      suc_msg: "Account unlinked successfully",
    },
  ),
};
