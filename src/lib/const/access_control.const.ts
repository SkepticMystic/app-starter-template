export const ACCESS_CONTROL = {
  ROLES: {
    IDS: ["user", "admin"] as const,
  },
};

export declare namespace IAccessControl {
  type RoleId = (typeof ACCESS_CONTROL.ROLES.IDS)[number];
}
