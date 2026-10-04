import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";
import type { IOrganization } from "./organization.const.js";

/**
 * What each org role may do — independent of the global `user.role` in
 * `access_control.const.ts`. Passed to the organization plugin, so this is
 * what Better-Auth's own endpoints (invite, remove member, delete org) check,
 * and what `Authz.can` answers from.
 */
const statement = {
  ...defaultStatements,
  /** The resource Better-Auth's api-key plugin checks for org-owned keys. */
  apiKey: ["create", "read", "update", "delete"],
  /** The org's security log: member and API-key changes, and who made them. */
  audit: ["read"],
} as const;

const ac = createAccessControl(statement);

/** A permission request, e.g. `{ organization: ["delete"] }`. */
export type OrgPermissions = {
  [K in keyof typeof statement]?: (typeof statement)[K][number][];
};

export const OrgAccessControl = {
  ac,

  roles: {
    // The `...Ac.statements` spreads are load-bearing: passing `roles` to the
    // organization plugin replaces its defaults, including who can invite and
    // remove members.
    member: ac.newRole({ ...memberAc.statements, apiKey: ["read"] }),
    admin: ac.newRole({
      ...adminAc.statements,
      apiKey: ["create", "read", "update", "delete"],
      audit: ["read"],
    }),
    owner: ac.newRole({
      ...ownerAc.statements,
      apiKey: ["create", "read", "update", "delete"],
      audit: ["read"],
    }),
  } satisfies Record<IOrganization.RoleId, ReturnType<typeof ac.newRole>>,
};

/**
 * Whether `role` — Better-Auth's comma-separated `member.role` — grants
 * `permissions`, with `hasPermissionFn`'s semantics minus
 * `allowCreatorAllPermissions`. Local because `checkRolePermission` is only on
 * the browser client. An unknown role id is a refusal.
 */
export const check_org_role_permission = (
  role: string,
  permissions: OrgPermissions,
): boolean =>
  role
    .split(",")
    .some(
      (id) =>
        Object.hasOwn(OrgAccessControl.roles, id) &&
        OrgAccessControl.roles[id as IOrganization.RoleId].authorize(
          permissions,
        ).success,
    );
