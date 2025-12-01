const ROLE_IDS = ["user", "admin"] as const;
export type RoleId = (typeof ROLE_IDS)[number];

const ROLE_MAP = {
  user: { label: "User" },
  admin: { label: "Admin" },
} satisfies Record<RoleId, { label: string }>;

export const ROLES = {
  IDS: ROLE_IDS,
  MAP: ROLE_MAP,
  OPTIONS: ROLE_IDS.map((id) => ({
    value: id,
    label: ROLE_MAP[id].label,
  })),
};
