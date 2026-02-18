import { command, form, query } from "$app/server";
import { db } from "$lib/server/db/drizzle.db";
import {
  TaskSchema,
  TaskTable,
  type Task,
} from "$lib/server/db/models/task.model";
import { Repo } from "$lib/server/db/repos/index.repo";
import {
  get_session,
  safe_get_session,
} from "$lib/server/services/auth.service";
import { result } from "$lib/utils/result.util";
import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const get_all_tasks_remote = query(async () => {
  const session = await safe_get_session();
  if (!session) return [];

  const tasks = await Repo.query(
    db.query.task.findMany({
      where: { org_id: session.session.org_id },

      orderBy: { createdAt: "desc" },
    }),
  );

  if (!tasks.ok) {
    error(tasks.error.status ?? 500, tasks.error.message);
  }

  return tasks.data;
});

export const create_task_remote = form(
  TaskSchema.insert, //
  async (input): Promise<App.Result<Task>> => {
    const { session } = await get_session();

    const task = await Repo.insert_one(
      db
        .insert(TaskTable)
        .values({
          ...input,

          org_id: session.org_id,
          user_id: session.userId,
          member_id: session.member_id,
        })
        .returning(),
    );

    return task;
  },
);

export const update_task_remote = form(
  TaskSchema.update, //
  async (input) => {
    const { session } = await get_session();

    const task = await Repo.update_one(
      db
        .update(TaskTable)
        .set(input)
        .where(
          and(
            eq(TaskTable.id, input.id), //
            eq(TaskTable.org_id, session.org_id),
          ),
        )
        .returning(),
    );

    return task;
  },
);

export const delete_task_remote = command(
  z.uuid(), //
  async (task_id) => {
    const { session } = await get_session();

    const res = await Repo.delete_one(
      db
        .delete(TaskTable)
        .where(
          and(
            eq(TaskTable.id, task_id), //
            eq(TaskTable.org_id, session.org_id),
          ),
        )
        .execute(),
    );

    if (!res.ok) {
      return res;
    } else {
      return result.suc();
    }
  },
);
