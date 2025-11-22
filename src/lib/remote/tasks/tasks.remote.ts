import { command, query } from "$app/server";
import { get_session } from "$lib/auth/server";
import { TaskSchema } from "$lib/schema/task.schema";
import { db } from "$lib/server/db/drizzle.db";
import { TaskTable, type Task } from "$lib/server/db/schema/task.models";
import type { APIResult } from "$lib/utils/form.util";
import { err, suc } from "$lib/utils/result.util";
import { and, eq } from "drizzle-orm";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import z from "zod";

export const get_all_tasks_remote = query(async () => {
  const session = await get_session();

  const tasks = await db.query.task.findMany({
    where: (task, { eq, and }) => and(eq(task.org_id, session.session.org_id)),

    orderBy: (task, { desc }) => [desc(task.createdAt)],
  });

  return tasks;
});

export const create_task = command(
  "unchecked",
  async (data): Promise<APIResult<Task>> => {
    const [{ session }, form] = await Promise.all([
      get_session(),
      superValidate(data, zod4(TaskSchema.create)),
    ]);
    console.log("create_task.form", form);

    if (!form.valid) {
      return err();
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
        .returning();

      return suc(task);
    } catch (error) {
      console.error("create_task.error", error);

      return err({ message: "Failed to create task" });
    }
  },
);

export const delete_task = command(
  z.string().min(1),
  async (task_id): Promise<APIResult<undefined>> => {
    const { session } = await get_session();

    try {
      const result = await db
        .delete(TaskTable)
        .where(
          and(eq(TaskTable.id, task_id), eq(TaskTable.org_id, session.org_id)),
        )
        .execute();

      if (!result.rowCount) {
        return err({ message: "Task not found" });
      }

      return suc();
    } catch (e) {
      console.error("delete_task.error", e);
      return err({ message: "Failed to delete task" });
    }
  },
);
