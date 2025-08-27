import { BetterAuthClient } from "$lib/auth-client";
import {
  ACCESS_CONTROL,
  type IAccessControl,
} from "$lib/const/access_control.const";
import { TIME } from "$lib/const/time";
import { Format } from "$lib/utils/format.util";
import { err, suc } from "$lib/utils/result.util";
import { Client } from "./index.client";

export const AdminClient = {
  update_user_role: (user_id: string, role_id: IAccessControl.RoleId) =>
    Client.request(
      async () => {
        if (
          !confirm(
            `Are you sure you want to update this user's role to ${ACCESS_CONTROL.ROLES.MAP[role_id].name}?`,
          )
        ) {
          return err();
        }

        const res = await BetterAuthClient.admin.setRole({
          role: role_id,
          userId: user_id,
        });

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn("Failed to update user role:", res.error);
          return err(
            res.error?.message ??
              "Failed to update user role. Please try again.",
          );
        }
      },
      { toast: { suc: "User role updated successfully." } },
    ),

  impersonate_user: (user_id: string) =>
    Client.request(
      async () => {
        if (!confirm("Are you sure you want to impersonate this user?")) {
          return err();
        }

        const res = await BetterAuthClient.admin.impersonateUser({
          userId: user_id,
        });

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn("Failed to impersonate user:", res.error);
          return err(
            res.error?.message ??
              "Failed to impersonate user. Please try again.",
          );
        }
      },
      // NOTE: Show toast after redirect in ?toast param
    ),

  stop_impersonating: () =>
    Client.request(
      async () => {
        const res = await BetterAuthClient.admin.stopImpersonating();

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn("Failed to stop impersonation:", res.error);
          return err(
            res.error?.message ??
              "Failed to stop impersonation. Please try again.",
          );
        }
      },
      { toast: { suc: "Stopped impersonation successfully." } },
    ),

  ban_user: (
    user_id: string,
    options: { expires_in?: number; reason?: string },
  ) =>
    Client.request(
      async () => {
        if (
          !confirm(
            `Are you sure you want to ban this user ${
              options.expires_in
                ? `for ${Format.number(options.expires_in / TIME.DAY)} days?`
                : "idefinitely?"
            }`,
          )
        ) {
          return err();
        }

        const res = await BetterAuthClient.admin.banUser({
          userId: user_id,
          banReason: options.reason,
          banExpiresIn: options.expires_in,
        });

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn("Failed to ban user:", res.error);
          return err(
            res.error?.message ?? "Failed to ban user. Please try again.",
          );
        }
      },
      { toast: { suc: "User banned successfully." } },
    ),

  unban_user: (user_id: string) =>
    Client.request(
      async () => {
        if (!confirm("Are you sure you want to unban this user?")) {
          return err();
        }

        const res = await BetterAuthClient.admin.unbanUser({
          userId: user_id,
        });

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn("Failed to unban user:", res.error);
          return err(
            res.error?.message ?? "Failed to unban user. Please try again.",
          );
        }
      },
      { toast: { suc: "User unbanned successfully." } },
    ),

  delete_user: async (user_id: string) =>
    Client.request(
      async () => {
        if (!confirm("Are you sure you want to delete this user?")) {
          return err();
        }

        const res = await BetterAuthClient.admin.removeUser({
          userId: user_id,
        });

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn(res.error);
          return err(
            res.error.message ?? "Failed to delete user. Please try again.",
          );
        }
      },
      { toast: { suc: "User deleted successfully" } },
    ),
};
