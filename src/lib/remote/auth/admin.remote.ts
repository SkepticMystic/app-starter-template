import { ROLES } from "#lib/const/auth/role.const.js";
import {
  ADMIN,
  define_guard,
  guarded_command,
} from "#lib/server/remote/guarded.js";
import { AdminService } from "#lib/server/services/auth/admin/admin.service.js";
import { z } from "zod";

export const set_user_role_remote = guarded_command(
  ADMIN,
  z.object({ userId: z.uuid(), role: z.enum(ROLES.IDS) }),
  async (input) => AdminService.set_role(input),
);

export const impersonate_user_remote = guarded_command(
  ADMIN,
  z.uuid(),
  async (user_id) => AdminService.impersonate(user_id),
);

/**
 * Called from inside the impersonation, so the session is the impersonated
 * user's: not an admin, and maybe unverified. Better-Auth checks the session's
 * `impersonatedBy` and the signed admin cookie itself.
 */
const IMPERSONATING = define_guard({
  level: "user",
  session: { email_verified: false },
});

export const stop_impersonating_remote = guarded_command(
  IMPERSONATING,
  async () => AdminService.stop_impersonating(),
);

export const ban_user_remote = guarded_command(
  ADMIN,
  z.object({
    userId: z.uuid(),
    banReason: z.string().trim().max(500).optional(),
    banExpiresIn: z.number().int().positive().optional(),
  }),
  async (input) => AdminService.ban(input),
);

export const unban_user_remote = guarded_command(
  ADMIN,
  z.uuid(),
  async (user_id) => AdminService.unban(user_id),
);

// Better-Auth's own permission check runs after `AdminService.remove` has
// cancelled the user's billing, so this one has to refuse first.
export const remove_user_remote = guarded_command(
  { ...ADMIN, session: { admin: true, permissions: { user: ["delete"] } } },
  z.uuid(),
  async (target_id, { user_id }) => AdminService.remove(target_id, user_id),
);
