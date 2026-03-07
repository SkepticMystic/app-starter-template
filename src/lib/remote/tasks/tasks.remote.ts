import { command, form, query } from "$app/server";
import { ERROR } from "$lib/const/error.const";
import { db } from "$lib/server/db/drizzle.db";
import { TaskSchema, type Task } from "$lib/server/db/models/task.model";
import { Repo } from "$lib/server/db/repos/index.repo";
import { get_session } from "$lib/server/services/auth.service";
import { TaskService } from "$lib/server/services/task/task.service";
import { result } from "$lib/utils/result.util";
import z from "zod";

export const get_all_tasks_remote = query(async () => {
  const session = await get_session();
  if (!session.ok) return session;
  else if (!session.data.session.org_id) {
    return result.err(ERROR.FORBIDDEN);
  }

  const tasks = await Repo.query(
    db.query.task.findMany({
      where: { org_id: session.data.session.org_id },

      orderBy: { createdAt: "desc" },
    }),
  );

  return tasks;
});

export const create_task_remote = form(
  TaskSchema.insert, //
  async (input): Promise<App.Result<Task>> => {
    const session = await get_session();
    if (!session.ok) return session;

    const res = await TaskService.create(input, session.data);

    return res;
  },
);

export const update_task_remote = form(
  TaskSchema.update, //
  async (input) => {
    const session = await get_session();
    if (!session.ok) return session;
    else if (!session.data.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

    const res = await TaskService.update(input, session.data);

    return res;
  },
);

export const delete_task_remote = command(
  z.uuid(), //
  async (task_id) => {
    const session = await get_session();
    if (!session.ok) return session;

    const res = await TaskService.delete(task_id, session.data);

    return res;
  },
);
