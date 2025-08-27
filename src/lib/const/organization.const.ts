const ROLE_IDS = ["member", "admin", "owner"] as const;

const INVITATION_STATUS = [
  "pending",
  "accepted",
  "canceled",
  "rejected",
] as const;

export const ORGANIZATION = {
  ROLES: {
    IDS: ROLE_IDS,
    MAP: {
      member: { name: "Member" },
      admin: { name: "Admin" },
      owner: { name: "Owner" },
    } satisfies Record<IOrganization.RoleId, { name: string }>,
  },

  INVITATIONS: {
    STATUSES: {
      IDS: INVITATION_STATUS,
      MAP: {
        pending: { name: "Pending" },
        accepted: { name: "Accepted" },
        canceled: { name: "Canceled" },
        rejected: { name: "Rejected" },
      } satisfies Record<IOrganization.InvitationStatus, { name: string }>,
    },
  },
};

export declare namespace IOrganization {
  export type RoleId = (typeof ROLE_IDS)[number];

  export type InvitationStatus = (typeof INVITATION_STATUS)[number];
}
