import {
  get_all_accounts_remote,
  unlink_account_remote,
} from "$lib/remote/auth/account.remote";
import { Client } from "./index.client";

export const AccountsClient = {
  unlink: async (input: Parameters<typeof unlink_account_remote>[0]) =>
    Client.request(
      () => unlink_account_remote(input).updates(get_all_accounts_remote()),
      {
        confirm: "Are you sure you want to unlink this account?",
        toast: { success: "Account unlinked successfully" },
      },
    ),
};
