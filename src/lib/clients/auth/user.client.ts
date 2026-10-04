import { goto } from "$app/navigation";
import { Toast } from "#lib/utils/toast.util.js";
import { resolve } from "$app/paths";
import { sign_out_remote } from "#lib/remote/auth/session.remote.js";
import {
  export_account_data_remote,
  request_account_deletion_remote,
} from "#lib/remote/auth/user.remote.js";
import { APP } from "#lib/const/app.const.js";
import { Client } from "../index.client.js";

export const UserClient = {
  request_deletion: Client.wrap(request_account_deletion_remote, {
    suc_msg: {
      title: "Account deletion requested",
      description: "Check your email to confirm it.",
    },
    confirm:
      "Delete your account? We'll email you a link to confirm it. Once you do, it cannot be undone.",
    destructive: true,
    action_label: "Delete account",
  }),

  /** Saved as a file in the browser; the server never writes one. */
  export_data: Client.wrap(
    async () => {
      const res = await export_account_data_remote();
      if (!res.ok) return res;

      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${APP.ID}-account-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();

      URL.revokeObjectURL(url);

      return res;
    },
    { suc_msg: "Your data is downloading" },
  ),

  signout: async () => {
    const res = await sign_out_remote().catch((error: unknown) => {
      console.error("Error signing out:", error);
      return null;
    });

    if (!res?.ok) {
      location.reload();
    } else if (res.data.url) {
      // The provider's end-session page, to sign out there too.
      location.href = res.data.url;
    } else {
      Toast.info("Signed out");
      // `refreshAll`: the root layout's `page.data.user` would otherwise outlive the session.
      await goto(resolve("auth/signin"), { refreshAll: true });
    }
  },
};
