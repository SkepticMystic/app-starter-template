const ROLE_IDS = ["user", "admin"] as const;

export const ACCESS_CONTROL = {
  ROLES: {
    IDS: ROLE_IDS,
    MAP: {
      user: { name: "User" },
      admin: { name: "Admin" },
    } satisfies Record<IAccessControl.RoleId, { name: string }>,
  },
};

export declare namespace IAccessControl {
  type RoleId = (typeof ROLE_IDS)[number];
}
