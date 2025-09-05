const ROLE_IDS = ["user", "admin"] as const;
const ROLE_MAP = {
  user: { label: "User" },
  admin: { label: "Admin" },
} satisfies Record<IAccessControl.RoleId, { label: string }>;

export const ACCESS_CONTROL = {
  ROLES: {
    IDS: ROLE_IDS,
    MAP: ROLE_MAP,
    OPTIONS: Object.entries(ROLE_MAP).map(([value, { label }]) => ({
      value,
      label,
    })),
  },
};

export declare namespace IAccessControl {
  type RoleId = (typeof ROLE_IDS)[number];
}
