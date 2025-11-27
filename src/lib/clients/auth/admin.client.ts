import { BetterAuthClient } from "$lib/auth-client";
import { ACCESS_CONTROL, type IAccessControl } from "$lib/const/auth/access_control.const";
import { TIME } from "$lib/const/time.const";
import { Format } from "$lib/utils/format.util";
import { Client } from "../index.client";

export const AdminClient = {
  update_user_role: Client.better_auth(
    (input: { userId: string; role: IAccessControl.RoleId }) =>
      BetterAuthClient.admin.setRole(input),
    {
      suc_msg: "User role updated",
      confirm: (input) =>
        `Are you sure you want to update this user's role to ${ACCESS_CONTROL.ROLES.MAP[input.role].label}?`,
    },
  ),

  impersonate_user: (userId: string) =>
    Client.better_auth(() => BetterAuthClient.admin.impersonateUser({ userId }), {
      suc_msg: "Impersonation started",
    }),

  stop_impersonating: Client.better_auth(() => BetterAuthClient.admin.stopImpersonating(), {
    confirm: "Are you sure you want to stop impersonating?",
    suc_msg: "Impersonation stopped",
  }),

  ban_user: Client.better_auth(
    (input: Parameters<typeof BetterAuthClient.admin.banUser>[0]) =>
      BetterAuthClient.admin.banUser(input),
    {
      suc_msg: "User banned",
      confirm: (input) =>
        `Are you sure you want to ban this user ${
          input.banExpiresIn
            ? `for ${Format.number(input.banExpiresIn / TIME.DAY, { maximumFractionDigits: 0 })} days?`
            : "indefinitely?"
        }`,
    },
  ),

  unban_user: Client.better_auth((userId: string) => BetterAuthClient.admin.unbanUser({ userId }), {
    confirm: "Are you sure you want to unban this user?",
    suc_msg: "User unbanned",
  }),

  delete_user: Client.better_auth(
    (userId: string) => BetterAuthClient.admin.removeUser({ userId }),
    {
      confirm: "Are you sure you want to delete this user?",
      suc_msg: "User deleted",
    },
  ),
};
