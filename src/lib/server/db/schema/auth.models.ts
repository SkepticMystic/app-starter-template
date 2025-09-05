import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { ACCESS_CONTROL } from "../../../const/access_control.const";
import { AUTH } from "../../../const/auth.const";
import { ORGANIZATION } from "../../../const/organization.const";
import { Schema } from "./index.schema";

export const user_role_enum = pgEnum("user_role", ACCESS_CONTROL.ROLES.IDS);

// Define User table schema
export const UserTable = pgTable("user", {
  id: varchar().primaryKey(),

  // NOTE: BetterAuth defaults name to ''
  name: varchar({ length: 255 }).default(""),
  email: varchar({ length: 255 }).unique(),
  emailVerified: boolean().default(false).notNull(),
  image: varchar({ length: 2048 }),

  // Admin fields
  role: user_role_enum().default("user").notNull(),
  banned: boolean().default(false).notNull(),
  banReason: text(),
  banExpires: timestamp({ mode: "date" }),

  ...Schema.timestamps,
});

// Export type for use in application
export type User = typeof UserTable.$inferSelect;
export type NewUser = typeof UserTable.$inferInsert;

export const SessionTable = pgTable(
  "session",
  {
    id: varchar().primaryKey(),
    userId: varchar()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),

    token: varchar({ length: 255 }).notNull().unique(),

    ipAddress: varchar({ length: 45 }), // Supports IPv6
    userAgent: varchar({ length: 2048 }),

    // Admin
    impersonatedBy: varchar().references(() => UserTable.id, {
      onDelete: "set null",
    }),

    // Organization
    member_id: varchar().references(() => MemberTable.id, {
      onDelete: "set null",
    }),

    activeOrganizationId: varchar().references(() => OrganizationTable.id, {
      onDelete: "set null",
    }),

    expiresAt: timestamp({ mode: "date" }).notNull(),
    ...Schema.timestamps,
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export type Session = typeof SessionTable.$inferSelect;
export type NewSession = typeof SessionTable.$inferInsert;

// Create an enum for provider IDs
export const provider_id_enum = pgEnum("provider_id", AUTH.PROVIDERS.IDS);

export const AccountTable = pgTable(
  "account",
  {
    id: varchar().primaryKey(),
    userId: varchar()
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

export const OrganizationTable = pgTable("organization", {
  id: varchar().primaryKey(),

  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  logo: varchar({ length: 2048 }),

  metadata: text(),

  ...Schema.timestamps,
});

export type Organization = typeof OrganizationTable.$inferSelect;
export type InsertOrganization = typeof OrganizationTable.$inferInsert;

export const member_role_enum = pgEnum("member_role", [
  "owner",
  "admin",
  "member",
]);

export const MemberTable = pgTable(
  "member",
  {
    id: varchar().primaryKey(),

    userId: varchar()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),

    organizationId: varchar()
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

export const PasskeyTable = pgTable(
  "passkey",
  {
    id: varchar().primaryKey(),

    name: varchar({ length: 255 }),
    userId: varchar()
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

export const invitation_status_enum = pgEnum(
  "invitation_status",
  ORGANIZATION.INVITATIONS.STATUSES.IDS,
);

export const InvitationTable = pgTable(
  "invitation",
  {
    id: varchar().primaryKey(),
    email: varchar({ length: 255 }).notNull(),

    inviterId: varchar()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    organizationId: varchar()
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

export const VerificationTable = pgTable("verification", {
  id: varchar().primaryKey(),
  identifier: varchar({ length: 255 }).notNull().unique(),
  value: varchar({ length: 2048 }).notNull(),

  expiresAt: timestamp({ mode: "date" }).notNull(),
  ...Schema.timestamps,
});

export type Verification = typeof VerificationTable.$inferSelect;
export type NewVerification = typeof VerificationTable.$inferInsert;
