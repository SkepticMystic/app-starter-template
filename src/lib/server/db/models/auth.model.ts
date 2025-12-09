import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { AUTH } from "../../../const/auth/auth.const";
import { ORGANIZATION } from "../../../const/auth/organization.const";
import { ROLES } from "../../../const/auth/role.const";
import { Schema } from "./index.schema";

export const user_role_enum = pgEnum("user_role", ROLES.IDS);

// Define User table schema
export const UserTable = pgTable("user", {
  ...Schema.id(),

  // NOTE: BetterAuth defaults name to ''
  name: varchar({ length: 255 }).notNull().default(""),
  email: varchar({ length: 255 }).notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  image: varchar({ length: 2048 }),

  // Admin fields
  role: user_role_enum().default("user").notNull(),
  banned: boolean().default(false).notNull(),
  banReason: text(),
  banExpires: timestamp({ mode: "date" }),

  twoFactorEnabled: boolean().default(false).notNull(),

  ...Schema.timestamps,
});

// Export type for use in application
export type User = typeof UserTable.$inferSelect;
export type NewUser = typeof UserTable.$inferInsert;

export const user_relations = relations(UserTable, ({ many }) => ({
  accounts: many(AccountTable),
  sessions: many(SessionTable),
  members: many(MemberTable),
  passkeys: many(PasskeyTable),
  invitations: many(InvitationTable),
}));

export const SessionTable = pgTable(
  "session",
  {
    ...Schema.id(),

    userId: uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),

    token: varchar({ length: 255 }).notNull().unique(),

    ipAddress: varchar({ length: 45 }), // Supports IPv6
    userAgent: varchar({ length: 2048 }),

    // Admin
    impersonatedBy: uuid().references(() => UserTable.id, {
      onDelete: "set null",
    }),

    // Organization
    member_id: uuid().references(() => MemberTable.id, {
      onDelete: "set null",
    }),

    activeOrganizationId: uuid().references(() => OrganizationTable.id, {
      onDelete: "set null",
    }),

    expiresAt: timestamp({ mode: "date" }).notNull(),
    ...Schema.timestamps,
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export type Session = typeof SessionTable.$inferSelect;
export type NewSession = typeof SessionTable.$inferInsert;

export const session_relations = relations(SessionTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [SessionTable.userId],
    references: [UserTable.id],
  }),
  member: one(MemberTable, {
    fields: [SessionTable.member_id],
    references: [MemberTable.id],
  }),
  organization: one(OrganizationTable, {
    fields: [SessionTable.activeOrganizationId],
    references: [OrganizationTable.id],
  }),
}));

// Create an enum for provider IDs
export const provider_id_enum = pgEnum("provider_id", AUTH.PROVIDERS.IDS);

export const AccountTable = pgTable(
  "account",
  {
    ...Schema.id(),

    userId: uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),

    accountId: varchar().notNull(),
    providerId: provider_id_enum().notNull(),

    password: varchar({ length: 255 }),

    scope: text(),
    idToken: varchar({ length: 2048 }),
    accessToken: varchar({ length: 2048 }),
    refreshToken: varchar({ length: 2048 }),
    accessTokenExpiresAt: timestamp({ mode: "date" }),
    refreshTokenExpiresAt: timestamp({
      mode: "date",
    }),

    ...Schema.timestamps,
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export type Account = typeof AccountTable.$inferSelect;
export type NewAccount = typeof AccountTable.$inferInsert;

export const account_relations = relations(AccountTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [AccountTable.userId],
    references: [UserTable.id],
  }),
}));

export const OrganizationTable = pgTable("organization", {
  ...Schema.id(),

  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  logo: varchar({ length: 2048 }),

  metadata: text(),

  ...Schema.timestamps,
});

export type Organization = typeof OrganizationTable.$inferSelect;
export type InsertOrganization = typeof OrganizationTable.$inferInsert;

export const organization_relations = relations(
  OrganizationTable,
  ({ many }) => ({
    members: many(MemberTable),
    invitations: many(InvitationTable),
  }),
);

export const member_role_enum = pgEnum("member_role", ORGANIZATION.ROLES.IDS);

export const MemberTable = pgTable(
  "member",
  {
    ...Schema.id(),

    userId: uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),

    organizationId: uuid()
      .notNull()
      .references(() => OrganizationTable.id, { onDelete: "cascade" }),

    role: member_role_enum().default("member").notNull(),

    ...Schema.timestamps,
  },
  (table) => [
    index("member_user_id_idx").on(table.userId),
    index("member_organization_id_idx").on(table.organizationId),
  ],
);

export type Member = typeof MemberTable.$inferSelect;
export type InsertMember = typeof MemberTable.$inferInsert;

export const member_relations = relations(MemberTable, ({ one }) => ({
  organization: one(OrganizationTable, {
    fields: [MemberTable.organizationId],
    references: [OrganizationTable.id],
  }),
  user: one(UserTable, {
    fields: [MemberTable.userId],
    references: [UserTable.id],
  }),
}));

export const PasskeyTable = pgTable(
  "passkey",
  {
    ...Schema.id(),

    name: varchar({ length: 255 }),
    userId: uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),

    publicKey: varchar({ length: 2048 }).notNull(),
    credentialID: varchar({ length: 512 }).notNull(),
    counter: integer().notNull(),
    deviceType: varchar({ length: 255 }),
    backedUp: boolean().notNull(),
    transports: jsonb().notNull().$type<string[]>(), // Using jsonb for array of strings
    aaguid: varchar({ length: 255 }).notNull(),

    ...Schema.timestamps,
  },
  (table) => [index("passkey_user_id_idx").on(table.userId)],
);

export type Passkey = typeof PasskeyTable.$inferSelect;
export type InsertPasskey = typeof PasskeyTable.$inferInsert;

export const passkey_relations = relations(PasskeyTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [PasskeyTable.userId],
    references: [UserTable.id],
  }),
}));

export const invitation_status_enum = pgEnum(
  "invitation_status",
  ORGANIZATION.INVITATIONS.STATUSES.IDS,
);

export const InvitationTable = pgTable(
  "invitation",
  {
    ...Schema.id(),

    email: varchar({ length: 255 }).notNull(),

    inviterId: uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationTable.id, { onDelete: "cascade" }),

    role: member_role_enum().default("member").notNull(),
    status: invitation_status_enum().default("pending").notNull(),

    expiresAt: timestamp({ mode: "date" }).notNull(),
    ...Schema.timestamps,
  },
  (table) => [
    index("invitation_email_idx").on(table.email),
    index("invitation_organization_id_idx").on(table.organizationId),
  ],
);

export type Invitation = typeof InvitationTable.$inferSelect;
export type NewInvitation = typeof InvitationTable.$inferInsert;

export const invitation_relations = relations(InvitationTable, ({ one }) => ({
  inviter: one(UserTable, {
    fields: [InvitationTable.inviterId],
    references: [UserTable.id],
  }),
  organization: one(OrganizationTable, {
    fields: [InvitationTable.organizationId],
    references: [OrganizationTable.id],
  }),
}));

export const VerificationTable = pgTable("verification", {
  ...Schema.id(),

  identifier: varchar({ length: 255 }).notNull().unique(),
  value: varchar({ length: 2048 }).notNull(),

  expiresAt: timestamp({ mode: "date" }).notNull(),
  ...Schema.timestamps,
});

export type Verification = typeof VerificationTable.$inferSelect;
export type NewVerification = typeof VerificationTable.$inferInsert;

export const TwoFactorTable = pgTable(
  "two_factor",
  {
    ...Schema.id(),

    userId: uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),

    secret: varchar({ length: 255 }).notNull(),
    backupCodes: varchar({ length: 1023 }).notNull(),

    ...Schema.timestamps,
  },
  (table) => [index("two_factor_user_id_idx").on(table.userId)],
);

export type TwoFactor = typeof TwoFactorTable.$inferSelect;
export type NewTwoFactor = typeof TwoFactorTable.$inferInsert;
