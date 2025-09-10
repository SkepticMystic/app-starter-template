import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { TASKS } from "../../../const/task.const";
import { MemberTable, OrganizationTable, UserTable } from "./auth.models";
import { Schema } from "./index.schema";

export const task_status_enum = pgEnum("task_status", TASKS.STATUS.IDS);

// Define Task table schema
export const TaskTable = pgTable(
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
    member_id: uuid()
      .notNull()
      .references(() => MemberTable.id, { onDelete: "cascade" }),
    user_id: uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),

    assigned_member_id: uuid().references(() => MemberTable.id, {
      onDelete: "set null",
    }),

    ...Schema.timestamps,
  },
  (table) => [
    index("idx_task_org_id").on(table["org_id"]),
    index("idx_task_user_id").on(table["user_id"]),
    index("idx_task_member_id").on(table["member_id"]),
    index("idx_task_assigned_member_id").on(table["assigned_member_id"]),
  ],
);

// Export type for use in application
export type Task = typeof TaskTable.$inferSelect;
export type NewTask = typeof TaskTable.$inferInsert;
