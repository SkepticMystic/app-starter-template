import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  userAc,
} from "better-auth/plugins/admin/access";
import type { RoleId } from "$lib/const/auth/role.const";

const statement = {
  ...defaultStatements,
  // project: ["create", "share", "update", "delete"],
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
