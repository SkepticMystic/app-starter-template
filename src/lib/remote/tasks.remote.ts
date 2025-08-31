import { command, query } from "$app/server";
import type { Pathname } from "$app/types";
import { get_session } from "$lib/auth/server";
import { TASKS } from "$lib/const/task.const";
import { TaskSchema } from "$lib/schema/task.schema";
import { db } from "$lib/server/db/drizzle.db";
import { TaskTable } from "$lib/server/db/schema/task.models";
import type { FormCommandResult } from "$lib/utils/form.util";
import { err, suc } from "$lib/utils/result.util";
import { error, fail } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { superValidate, type Infer } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import z from "zod";

export const get_tasks = query(
  z.object({
    status: z.enum(TASKS.STATUS.IDS).optional(),
  }),
  async (input) => {
    const session = await get_session();

    const tasks = await db.query.task.findMany({
      where: (task, { eq, and }) =>
        and(
          eq(task.org_id, session.session.org_id),
          input.status ? eq(task.status, input.status) : undefined,
        ),

      orderBy: (task, { desc }) => [desc(task.createdAt)],

      columns: {
        id: true,
        title: true,
        status: true,
        due_date: true,
        member_id: true,
        description: true,
        assigned_member_id: true,

        createdAt: true,
        updatedAt: true,
      },
    });

    return tasks;
  },
);

export const create_task = command(
  "unchecked",
  async (data): Promise<FormCommandResult<Infer<typeof TaskSchema.create>>> => {
    const [{ session }, form] = await Promise.all([
      get_session(),
      superValidate(data as any, zod4(TaskSchema.create)),
    ]);
    console.log("create_task.form", form);

    if (!form.valid) {
      return { type: "failure", ...fail(400, { form }) };
    }

    try {
      const [task] = await db
        .insert(TaskTable)
        .values({
          ...form.data,

          org_id: session.org_id,
          user_id: session.userId,
          member_id: session.member_id,
        })
        .returning({ id: TaskTable.id });

      return true
        ? {
            type: "success",
            status: 201,
            data: { form, toast: "Task created" },
          }
        : {
            status: 303,
            type: "redirect",
            location: `/tasks/${task.id}` satisfies Pathname,
          };
    } catch (error) {
      console.error("create_task.error", error);

      return {
        type: "failure",
        ...fail(500, { form, message: err("Failed to create task") }),
      };
    }
  },
);

export const delete_task = command(z.string().min(1), async (task_id) => {
  const { session } = await get_session();

  try {
    const result = await db
      .delete(TaskTable)
      .where(
        and(eq(TaskTable.id, task_id), eq(TaskTable.org_id, session.org_id)),
      )
      .execute();

    if (!result.rowCount) {
      error(400, "Task not found");
    }

    return suc();
  } catch (e) {
    console.error("delete_task.error", e);
    error(500, "Failed to delete task");
  }
});
