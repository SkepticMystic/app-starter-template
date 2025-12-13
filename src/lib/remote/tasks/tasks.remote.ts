import { command, form, query } from "$app/server";
import { db } from "$lib/server/db/drizzle.db";
import { TaskSchema, TaskTable } from "$lib/server/db/models/task.model";
import { Repo } from "$lib/server/db/repos/index.repo";
import { get_session } from "$lib/services/auth.service";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { error, invalid } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const get_all_tasks_remote = query(async () => {
  const { session } = await get_session();

  const tasks = await Repo.query(
    db.query.task.findMany({
      where: (task, { eq, and }) => and(eq(task.org_id, session.org_id)),

      orderBy: (task, { desc }) => [desc(task.createdAt)],
    }),
  );

  if (!tasks.ok) {
    error(tasks.error.status ?? 500, tasks.error.message);
  }

  return tasks.data;
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
