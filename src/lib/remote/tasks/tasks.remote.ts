import { command, form, query } from "$app/server";
import { get_session } from "$lib/auth/server";
import { db } from "$lib/server/db/drizzle.db";
import { TaskSchema, TaskTable } from "$lib/server/db/schema/task.models";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const get_all_tasks_remote = query(async () => {
  const { session } = await get_session();

  const tasks = await db.query.task.findMany({
    where: (task, { eq, and }) => and(eq(task.org_id, session.org_id)),

    orderBy: (task, { desc }) => [desc(task.createdAt)],
  });

  return tasks;
});

export const create_task_remote = form(
  TaskSchema.insert, //
  async (input) => {
    const { session } = await get_session();

    try {
      const [task] = await db
        .insert(TaskTable)
        .values({
          ...input,

          org_id: session.org_id,
          user_id: session.userId,
          member_id: session.member_id,
        })
        .returning();

      return result.suc(task);
    } catch (error) {
      Log.error(error, "create_task.error");

      captureException(error);

      return result.err({ message: "Failed to create task" });
    }
  },
);

export const update_task_remote = form(
  TaskSchema.update, //
  async (input) => {
    const { session } = await get_session();

    try {
      const [task] = await db
        .update(TaskTable)
        .set(input)
        .where(
          and(
            eq(TaskTable.id, input.id), //
            eq(TaskTable.org_id, session.org_id),
          ),
        )
        .returning();

      return result.suc(task);
    } catch (error) {
      Log.error(error, "update_task.error");

      captureException(error);

      return result.err({ message: "Failed to update task" });
    }
  },
);

export const delete_task_remote = command(
  z.uuid(), //
  async (task_id) => {
    const { session } = await get_session();

    try {
      const res = await db
        .delete(TaskTable)
        .where(
          and(
            eq(TaskTable.id, task_id), //
            eq(TaskTable.org_id, session.org_id),
          ),
        )
        .execute();

      if (!res.rowCount) {
        return result.err({ message: "Task not found" });
      }

      return result.suc();
    } catch (error) {
      Log.error(error, "delete_task.error");

      captureException(error);

      return result.err({ message: "Failed to delete task" });
    }
  },
);
