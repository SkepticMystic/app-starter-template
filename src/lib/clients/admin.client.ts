import { BetterAuthClient } from "$lib/auth-client";
import {
  ACCESS_CONTROL,
  type IAccessControl,
} from "$lib/const/access_control.const";
import { TIME } from "$lib/const/time";
import { BetterAuth } from "$lib/utils/better-auth.util";
import { Format } from "$lib/utils/format.util";
import { Effect, pipe } from "effect";
import { Client } from "./index.client";

export const AdminClient = {
  update_user_role: (input: { userId: string; role: IAccessControl.RoleId }) =>
    Client.better_auth(() => BetterAuthClient.admin.setRole(input), {
      confirm: `Are you sure you want to update this user's role to ${ACCESS_CONTROL.ROLES.MAP[input.role].label}?`,
      toast: { success: "User role updated" },
    }),

  impersonate_user: (userId: string) =>
    Client.better_auth(
      () => BetterAuthClient.admin.impersonateUser({ userId }),
      // NOTE: Show toast after redirect in ?toast param
    ),

  stop_impersonating: () =>
    Client.request(
      () =>
        Effect.runPromise(
          pipe(
            Effect.promise(() => BetterAuthClient.admin.stopImpersonating()),
            Effect.andThen((r) => BetterAuth.to_result(r)),
            // NOTE: I saw the session.subscribe callback run
            // But the /profile page didn't update.
            // So that's a TODO, but for now, a hard reload works.
            // BetterAuthClient.$store.notify("$sessionSignal");
            Effect.tap((r) => r.ok && location.reload()),
          ),
        ),
      {
        confirm: "Are you sure you want to stop impersonating?",
        toast: { success: "Stopped impersonation" },
      },
    ),

  ban_user: (
    userId: string,
    options: { banExpiresIn?: number; banReason?: string },
  ) =>
    Client.better_auth(
      () => BetterAuthClient.admin.banUser({ userId, ...options }),
      {
        confirm: `Are you sure you want to ban this user ${
          options.banExpiresIn
            ? `for ${Format.number(options.banExpiresIn / TIME.DAY, { maximumFractionDigits: 0 })} days?`
            : "indefinitely?"
        }`,
        toast: { success: "User banned" },
      },
    ),

  unban_user: (userId: string) =>
    Client.better_auth(() => BetterAuthClient.admin.unbanUser({ userId }), {
      confirm: "Are you sure you want to unban this user?",
      toast: { success: "User unbanned" },
    }),

  delete_user: (userId: string) =>
    Client.better_auth(() => BetterAuthClient.admin.removeUser({ userId }), {
      confirm: "Are you sure you want to delete this user?",
      toast: { success: "User deleted" },
    }),
};
