import { TIME } from "#lib/const/time.const.js";
import {
  ban_user_remote,
  impersonate_user_remote,
  remove_user_remote,
  set_user_role_remote,
  stop_impersonating_remote,
  unban_user_remote,
} from "#lib/remote/auth/admin.remote.js";
import { App } from "#lib/utils/app.js";
import { Format } from "#lib/utils/format.util.js";
import { Client } from "../index.client.js";
import { ROLES } from "#lib/const/auth/role.const.js";

export const AdminClient = {
  update_user_role: Client.wrap(set_user_role_remote, {
    suc_msg: "User role updated",
    confirm: (input) =>
      `Change this user's role to ${ROLES.MAP[input.role].label}? Their platform role decides whether they can reach the admin pages.`,
    action_label: "Change role",
  }),

  // A full load both ways, not `goto`: the session changes hands, so every client cache (remote
  // queries, `page.data.user`) belongs to the identity being left.
  impersonate_user: Client.wrap(impersonate_user_remote, {
    on_success: () => {
      globalThis.location.href = App.url("/home");
    },
  }),

  stop_impersonating: Client.wrap(stop_impersonating_remote, {
    confirm:
      "Stop impersonating this user? You'll be switched back to your own account.",
    action_label: "Stop impersonating",
    on_success: () => {
      globalThis.location.href = App.url("/admin/users");
    },
  }),

  ban_user: Client.wrap(ban_user_remote, {
    // `banExpiresIn` is in seconds; `TIME` is in milliseconds.
    confirm: (input) =>
      input.banExpiresIn
        ? `Ban this user for ${Format.number((input.banExpiresIn * 1000) / TIME.DAY, { maximumFractionDigits: 0 })} days? They won't be able to sign in until the ban ends.`
        : "Ban this user indefinitely? They won't be able to sign in until an admin unbans them.",
    destructive: true,
    action_label: "Ban user",
  }),

  unban_user: Client.wrap(unban_user_remote, {
    confirm: "Unban this user? They'll be able to sign in again.",
    action_label: "Unban user",
    suc_msg: "User unbanned",
  }),

  delete_user: Client.wrap(remove_user_remote, {
    confirm:
      "Delete this user? Their account is removed and they lose access to every organization. This cannot be undone.",
    destructive: true,
    action_label: "Delete user",
    suc_msg: "User deleted",
  }),
};
