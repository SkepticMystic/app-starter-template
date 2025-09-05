import { BetterAuthClient } from "$lib/auth-client";
import {
  ACCESS_CONTROL,
  type IAccessControl,
} from "$lib/const/access_control.const";
import { TIME } from "$lib/const/time";
import { Format } from "$lib/utils/format.util";
import { Client } from "./index.client";

export const AdminClient = {
  update_user_role: (user_id: string, role_id: IAccessControl.RoleId) =>
    Client.better_auth(
      () =>
        BetterAuthClient.admin.setRole({
          role: role_id,
          userId: user_id,
        }),
      {
        confirm: `Are you sure you want to update this user's role to ${ACCESS_CONTROL.ROLES.MAP[role_id].name}?`,
        toast: { success: "User role updated successfully." },
      },
    ),

  impersonate_user: (user_id: string) =>
    Client.better_auth(
      () => BetterAuthClient.admin.impersonateUser({ userId: user_id }),
      // NOTE: Show toast after redirect in ?toast param
    ),

  stop_impersonating: () =>
    Client.better_auth(() => BetterAuthClient.admin.stopImpersonating(), {
      toast: { success: "Stopped impersonation successfully." },
    }),

  ban_user: (
    user_id: string,
    options: { expires_in?: number; reason?: string },
  ) =>
    Client.better_auth(
      () =>
        BetterAuthClient.admin.banUser({
          userId: user_id,
          banReason: options.reason,
          banExpiresIn: options.expires_in,
        }),
      {
        confirm: `Are you sure you want to ban this user ${
          options.expires_in
            ? `for ${Format.number(options.expires_in / TIME.DAY, { maximumFractionDigits: 0 })} days?`
            : "indefinitely?"
        }`,
        toast: { success: "User banned successfully." },
      },
    ),

  unban_user: (user_id: string) =>
    Client.better_auth(
      () => BetterAuthClient.admin.unbanUser({ userId: user_id }),
      {
        confirm: "Are you sure you want to unban this user?",
        toast: { success: "User unbanned successfully." },
      },
    ),

  delete_user: (user_id: string) =>
    Client.better_auth(
      () => BetterAuthClient.admin.removeUser({ userId: user_id }),
      {
        confirm: "Are you sure you want to delete this user?",
        toast: { success: "User deleted successfully" },
      },
    ),
};
