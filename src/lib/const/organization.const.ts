const ROLE_IDS = ["member", "admin", "owner"] as const;
const ROLE_ID_MAP = {
  member: { label: "Member" },
  admin: { label: "Admin" },
  owner: { label: "Owner" },
} satisfies Record<IOrganization.RoleId, { label: string }>;

const INVITATION_STATUS = [
  "pending",
  "accepted",
  "canceled",
  "rejected",
] as const;

const INVITATION_STATUS_MAP = {
  pending: { label: "Pending" },
  accepted: { label: "Accepted" },
  canceled: { label: "Canceled" },
  rejected: { label: "Rejected" },
} satisfies Record<IOrganization.InvitationStatus, { label: string }>;

export const ORGANIZATION = {
  ROLES: {
    IDS: ROLE_IDS,
    MAP: ROLE_ID_MAP,
    OPTIONS: ROLE_IDS.map((role) => ({
      value: role,
      label: ROLE_ID_MAP[role].label,
    })),
  },

  INVITATIONS: {
    STATUSES: {
      IDS: INVITATION_STATUS,
      MAP: INVITATION_STATUS_MAP,
      OPTIONS: INVITATION_STATUS.map((status) => ({
        value: status,
        label: INVITATION_STATUS_MAP[status].label,
      })),
    },
  },
};

export declare namespace IOrganization {
  export type RoleId = (typeof ROLE_IDS)[number];

  export type InvitationStatus = (typeof INVITATION_STATUS)[number];
}
