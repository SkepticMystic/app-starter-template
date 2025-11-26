const ROLE_IDS = ["user", "admin"] as const;
const ROLE_MAP = {
  user: { label: "User" },
  admin: { label: "Admin" },
} satisfies Record<IAccessControl.RoleId, { label: string }>;

export const ACCESS_CONTROL = {
  ROLES: {
    IDS: ROLE_IDS,
    MAP: ROLE_MAP,
    OPTIONS: ROLE_IDS.map((id) => ({
      value: id,
      label: ROLE_MAP[id].label,
    })),
  },
};

export declare namespace IAccessControl {
  export type RoleId = (typeof ROLE_IDS)[number];
}
