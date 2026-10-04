import {
  foreignKey,
  index,
  pgEnum,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { snakeCase } from "drizzle-orm/pg-core/casing";
import { createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { TASKS } from "../../../const/task.const.js";
import { WallClock } from "../../../utils/wall_clock.util.js";
import { MemberTable, OrganizationTable, UserTable } from "./auth.model.js";
import { Schema } from "./index.schema.js";

export const task_status_enum = pgEnum("task_status", TASKS.STATUS.IDS);

// Define Task table schema
export const TaskTable = snakeCase.table(
  "task",
  {
    ...Schema.id(),

    title: varchar({ length: 255 }).notNull(),
    description: text(),

    due_date: timestamp({ mode: "date" }),
    status: task_status_enum().default("pending").notNull(),

    org_id: uuid()
      .notNull()
      .references(() => OrganizationTable.id, { onDelete: "cascade" }),
    member_id: uuid().notNull(),
    user_id: uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),

    assigned_member_id: uuid(),

    ...Schema.timestamps,
  },
  (table) => [
    // Both members are keyed with `org_id`, so neither can name a member of
    // another org, whatever the service checks.
    foreignKey({
      name: "task_member_org_fkey",
      columns: [table.member_id, table.org_id],
      foreignColumns: [MemberTable.id, MemberTable.organizationId],
    }).onDelete("cascade"),
    /**
     * HAND-EDITED in `drizzle/20261004185714_tenant_member_fkeys`: the migration
     * says `ON DELETE SET NULL ("assigned_member_id")`, which drizzle cannot
     * express. A bare `set null` would null `org_id` too, and since that is
     * NOT NULL, removing an assignee — or deleting their org — would fail.
     * `db:push` emits the bare form, so a database built by push has the bug;
     * `migrations.test.ts` keeps the edit from being regenerated away.
     */
    foreignKey({
      name: "task_assignee_org_fkey",
      columns: [table.assigned_member_id, table.org_id],
      foreignColumns: [MemberTable.id, MemberTable.organizationId],
    }).onDelete("set null"),
    // Leads with `org_id`, so it serves every org-scoped lookup, and the
    // list's newest-first order without a sort.
    index("idx_task_org_id_created_at").on(table["org_id"], table["createdAt"]),
    index("idx_task_user_id").on(table["user_id"]),
    index("idx_task_member_id").on(table["member_id"]),
    index("idx_task_assigned_member_id").on(table["assigned_member_id"]),
  ],
);

export type Task = typeof TaskTable.$inferSelect;

const pick = {
  title: true,
  status: true,
  due_date: true,
  description: true,
  assigned_member_id: true,
} satisfies Partial<Record<keyof Task, true>>;

const refinements = {
  description: z
    .string()
    .max(5000, "Description must be at most 5000 characters")
    .optional(),
  assigned_member_id: z.uuid().optional(),
  /**
   * `datetime-local` carries no zone, so {@link WallClock} applies `TIME.ZONE` before coercion;
   * bare `z.coerce.date` read it as the server's UTC, saving a due date two hours off the one
   * typed.
   */
  due_date: z
    .union([
      z.literal("").transform((_) => undefined),
      z
        .string()
        .transform(WallClock.to_absolute_string)
        .pipe(z.coerce.date<string>("Invalid date")),
    ])
    .optional(),
};

export const TaskSchema = {
  insert: createInsertSchema(TaskTable, refinements).pick(pick),
  update: createUpdateSchema(TaskTable, refinements)
    .pick(pick)
    .extend({ id: z.uuid() }),

  /**
   * Turns validated update input into the column patch to `.set()`.
   *
   * Bound to the same `pick` as the schema above, so `id` — which `update`
   * extends in for the WHERE clause — cannot reach the SET clause, and an
   * emptied nullable field clears the column instead of being skipped.
   */
  patch: Schema.patcher(TaskTable, pick),
};

export type TaskSchema = {
  insert: z.input<typeof TaskSchema.insert>;
  update: z.input<typeof TaskSchema.update>;
};
