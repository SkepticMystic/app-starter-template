import { ACCESS_CONTROL } from "$lib/const/access_control.const";
import { AUTH } from "$lib/const/auth.const";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { Schema } from "./index.schema";

const pg_auth_folder = pgSchema("auth");

const user_role_enum = pgEnum("user_role", ACCESS_CONTROL.ROLES.IDS);

// Define User table schema
const user = pg_auth_folder.table("user", {
  id: varchar().primaryKey(),

  name: varchar({ length: 255 }),
  email: varchar({ length: 255 }).unique(),
  emailVerified: boolean().default(false).notNull(),
  image: varchar({ length: 2048 }),

  // Admin fields
  role: user_role_enum().default("user").notNull(),
  banned: boolean().default(false).notNull(),
  banReason: text(),
  banExpires: timestamp({ mode: "date" }),

  // Timestamps
  ...Schema.timestamps,
});

// Export type for use in application
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

const session = pg_auth_folder.table("session", {
  id: varchar().primaryKey(),
  userId: varchar()
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),

  token: varchar({ length: 255 }).notNull().unique(),

  ipAddress: varchar({ length: 45 }), // Supports IPv6
  userAgent: varchar({ length: 2048 }),

  // Admin
  impersonatedBy: varchar().references(() => user.id, {
    onDelete: "set null",
  }),

  // Organization
  activeOrganizationId: varchar().references(() => organization.id, {
    onDelete: "set null",
  }),

  // Timestamps
  expiresAt: timestamp({ mode: "date" }).notNull(),
  createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
});

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

// Create an enum for provider IDs
const provider_id_enum = pgEnum("provider_id", AUTH.PROVIDERS.IDS);

const account = pg_auth_folder.table("account", {
  id: varchar().primaryKey(),
  userId: varchar()
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),

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
});

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

const organization = pg_auth_folder.table("organization", {
  id: varchar().primaryKey(),

  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  logo: varchar({ length: 2048 }),

  metadata: text(),

  createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
});

export type Organization = typeof organization.$inferSelect;
export type InsertOrganization = typeof organization.$inferInsert;

const org_role_enum = pgEnum("org_role", ["owner", "admin", "member"]);

const member = pg_auth_folder.table("member", {
  id: varchar().primaryKey(),

  userId: varchar()
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),

  organizationId: varchar()
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),

  role: org_role_enum().default("member").notNull(),

  // Timestamps
  ...Schema.timestamps,
});

export type Member = typeof member.$inferSelect;
export type InsertMember = typeof member.$inferInsert;

const passkey = pg_auth_folder.table("passkey", {
  id: varchar().primaryKey(),

  name: varchar({ length: 255 }).notNull(),
  userId: varchar()
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),

  publicKey: varchar({ length: 2048 }).notNull(),
  credentialID: varchar({ length: 512 }).notNull(),
  counter: integer().notNull(),
  deviceType: varchar({ length: 255 }),
  backedUp: boolean().notNull(),
  transports: jsonb().notNull().$type<string[]>(), // Using jsonb for array of strings
  aaguid: varchar({ length: 255 }).notNull(),

  ...Schema.timestamps,
});

export type Passkey = typeof passkey.$inferSelect;
export type InsertPasskey = typeof passkey.$inferInsert;

const invitation_status_enum = pgEnum("invitation_status", [
  "accepted",
  "canceled",
  "rejected",
  "pending",
]);

const invitation = pg_auth_folder.table("invitation", {
  id: varchar().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),

  inviterId: varchar()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: varchar()
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),

  role: org_role_enum().default("member").notNull(),
  status: invitation_status_enum().default("pending").notNull(),

  expiresAt: timestamp({ mode: "date" }).notNull(),
  createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: "date" }).notNull().defaultNow(),
});

export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;

const verification = pg_auth_folder.table("verification", {
  id: varchar().primaryKey(),
  identifier: varchar({ length: 255 }).notNull().unique(),
  value: varchar({ length: 255 }).notNull(),

  // Timestamps
  expiresAt: timestamp({ mode: "date" }).notNull(),
  ...Schema.timestamps,
});

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

export const AuthModels = {
  user,
  member,
  session,
  account,
  passkey,
  invitation,
  organization,
  verification,
};
