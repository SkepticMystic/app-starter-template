import type { RoleId } from "#lib/const/auth/role.const.js";
import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  userAc,
} from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
} as const;

const ac = createAccessControl(statement);

export const AccessControl = {
  ac,

  roles: {
    user: ac.newRole({
      ...userAc.statements,
      // project: ["create", "share", "update"],
    }),

    admin: ac.newRole({
      ...adminAc.statements,
      // project: ["create", "share", "update", "delete"],
    }),
  } satisfies Record<RoleId, ReturnType<typeof ac.newRole>>,
};

/** A permission request against {@link statement}, e.g. `{ user: ["ban"] }`. */
export type AdminPermissions = {
  [K in keyof typeof statement]?: (typeof statement)[K][number][];
};

/**
 * Whether `role` — Better-Auth's comma-separated role string — grants
 * `permissions`. Better-Auth's admin `hasPermission`, minus the `adminUserIds`
 * bypass and the `defaultRole` fallback (callers refuse a roleless session).
 * Local because `checkRolePermission` is only on the browser client, and
 * importing that into server code drags the client in with it. An unknown role
 * id is a refusal, not a throw.
 */
export const check_role_permission = (
  role: string,
  permissions: AdminPermissions,
): boolean =>
  role
    .split(",")
    .some(
      (id) =>
        Object.hasOwn(AccessControl.roles, id) &&
        AccessControl.roles[id as RoleId].authorize(permissions).success,
    );
