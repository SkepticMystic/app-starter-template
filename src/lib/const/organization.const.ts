const ROLE_IDS = ["member", "admin", "owner"] as const;

export const ORGANIZATION = {
  ROLES: {
    IDS: ROLE_IDS,
    MAP: {
      member: { name: "Member" },
      admin: { name: "Admin" },
      owner: { name: "Owner" },
    } satisfies Record<IOrganization.RoleId, { name: string }>,
  },
};

export declare namespace IOrganization {
  export type RoleId = (typeof ROLE_IDS)[number];
}
