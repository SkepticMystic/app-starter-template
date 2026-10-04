import { index, jsonb, uuid, varchar } from "drizzle-orm/pg-core";
import { snakeCase } from "drizzle-orm/pg-core/casing";
import type { IAudit } from "../../../const/auth/audit.const.js";
import { OrganizationTable, UserTable } from "./auth.model.js";
import { Schema } from "./index.schema.js";

/**
 * The security log: one row per thing that happened to an account or an org,
 * written by `AuditService` and never updated, so there is no `updatedAt`.
 *
 * `type` is a `varchar` checked by `IAudit.EventId`, not a `pgEnum`, so a new
 * event is a code change rather than a migration.
 */
export const AuditEventTable = snakeCase.table(
  "audit_event",
  {
    ...Schema.id(),

    type: varchar({ length: 64 }).$type<IAudit.EventId>().notNull(),

    /**
     * Whose account it happened to. Null for an event with no account behind
     * it (an invitation to an address). A deleted account takes its history
     * with it.
     */
    user_id: uuid().references(() => UserTable.id, { onDelete: "cascade" }),
    /** Who did it, when that is not the subject: an admin, an org owner, an impersonator. */
    actor_user_id: uuid().references(() => UserTable.id, {
      onDelete: "set null",
    }),
    org_id: uuid().references(() => OrganizationTable.id, {
      onDelete: "cascade",
    }),

    ip: varchar({ length: 64 }),
    user_agent: varchar({ length: 512 }),
    /** `UserAgentUtil.describe` of `user_agent`, which new-device detection compares. */
    device: varchar({ length: 128 }),
    country: varchar({ length: 2 }),

    metadata: jsonb().$type<IAudit.Metadata>().default({}).notNull(),

    createdAt: Schema.timestamps.createdAt,
  },
  (table) => [
    // Each leads with what a view filters on, so its newest-first page is an
    // index scan.
    index("idx_audit_event_user_id_created_at").on(
      table["user_id"],
      table["createdAt"],
    ),
    index("idx_audit_event_org_id_created_at").on(
      table["org_id"],
      table["createdAt"],
    ),
    index("idx_audit_event_actor_user_id").on(table["actor_user_id"]),
    // The admin view, unscoped.
    index("idx_audit_event_created_at").on(table["createdAt"]),
  ],
);

export type AuditEvent = typeof AuditEventTable.$inferSelect;
