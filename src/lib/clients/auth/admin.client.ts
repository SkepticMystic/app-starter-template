import { BetterAuthClient } from "#lib/auth-client.js";
import { TIME } from "#lib/const/time.const.js";
import { App } from "#lib/utils/app.js";
import { Format } from "#lib/utils/format.util.js";
import { Client } from "../index.client.js";
import { type RoleId, ROLES } from "#lib/const/auth/role.const.js";

export const AdminClient = {
  update_user_role: Client.better_auth(
    (input: { userId: string; role: RoleId }) =>
      BetterAuthClient.admin.setRole(input),
    {
      suc_msg: "User role updated",
      confirm: (input) =>
        `Change this user's role to ${ROLES.MAP[input.role].label}? Their platform role decides whether they can reach the admin pages.`,
      action_label: "Change role",
    },
  ),

  // A full load both ways, not `goto`: the session changes hands, so every client cache (remote
  // queries, the Better-Auth store, `page.data.user`) belongs to the identity being left. This
  // was a factory before, and the admin page called it without calling what it returned, so the
  // menu item did nothing.
  impersonate_user: Client.better_auth(
    (userId: string) => BetterAuthClient.admin.impersonateUser({ userId }),
    {
      on_success: () => {
        globalThis.location.href = App.url("/home");
      },
    },
  ),

  stop_impersonating: Client.better_auth(
    () => BetterAuthClient.admin.stopImpersonating(),
    {
      confirm:
        "Stop impersonating this user? You'll be switched back to your own account.",
      action_label: "Stop impersonating",
      on_success: () => {
        globalThis.location.href = App.url("/admin/users");
      },
    },
  ),

  ban_user: Client.better_auth(
    (input: Parameters<typeof BetterAuthClient.admin.banUser>[0]) =>
      BetterAuthClient.admin.banUser(input),
    {
      // `banExpiresIn` is in seconds; `TIME` is in milliseconds.
      confirm: (input) =>
        input.banExpiresIn
          ? `Ban this user for ${Format.number((input.banExpiresIn * 1000) / TIME.DAY, { maximumFractionDigits: 0 })} days? They won't be able to sign in until the ban ends.`
          : "Ban this user indefinitely? They won't be able to sign in until an admin unbans them.",
      destructive: true,
      action_label: "Ban user",
    },
  ),

  unban_user: Client.better_auth(
    (userId: string) => BetterAuthClient.admin.unbanUser({ userId }),
    {
      confirm: "Unban this user? They'll be able to sign in again.",
      action_label: "Unban user",
      suc_msg: "User unbanned",
    },
  ),

  delete_user: Client.better_auth(
    (userId: string) => BetterAuthClient.admin.removeUser({ userId }),
    {
      confirm:
        "Delete this user? Their account is removed and they lose access to every organization. This cannot be undone.",
      destructive: true,
      action_label: "Delete user",
      suc_msg: "User deleted",
    },
  ),
};
