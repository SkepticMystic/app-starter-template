import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { TASKS } from "../../../const/task.const";
import { MemberTable, OrganizationTable, UserTable } from "./auth.model";
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

export type Task = typeof TaskTable.$inferSelect;

const pick = {
  title: true,
  status: true,
  due_date: true,
  description: true,
  assigned_member_id: true,
} satisfies Partial<Record<keyof Task, true>>;

const refinements = {
  description: z.string().optional(),
  assigned_member_id: z.uuid().optional(),
  due_date: z
    .union([
      z.literal("").transform((_) => undefined),
      z.coerce.date<string>("Invalid date"),
    ])
    .optional(),
};

export const TaskSchema = {
  insert: createInsertSchema(TaskTable, refinements).pick(pick),
  update: createUpdateSchema(TaskTable, refinements)
    .pick(pick)
    .extend({ id: z.uuid() }),
};

export type TaskSchema = {
  insert: z.input<typeof TaskSchema.insert>;
  update: z.input<typeof TaskSchema.update>;
};
