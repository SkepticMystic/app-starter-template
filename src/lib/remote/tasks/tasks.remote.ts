import { db } from "#lib/server/db/drizzle.db.js";
import { TaskSchema, type Task } from "#lib/server/db/models/task.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import {
  guarded_command,
  guarded_form,
  guarded_query,
  ORG,
} from "#lib/server/remote/guarded.js";
import { TaskService } from "#lib/server/services/task/task.service.js";
import { z } from "zod";

export const get_all_tasks_remote = guarded_query(ORG, async ({ org_id }) =>
  Repo.query(
    db.query.task.findMany({
      where: { org_id },

      orderBy: { createdAt: "desc" },
    }),
  ),
);

export const create_task_remote = guarded_form(
  ORG,
  TaskSchema.insert,
  async (input, { session }): Promise<App.Result<Task>> =>
    TaskService.create(input, session),
);

export const update_task_remote = guarded_form(
  ORG,
  TaskSchema.update,
  async (input, { session }) => TaskService.update(input, session),
);

export const delete_task_remote = guarded_command(
  ORG,
  z.uuid(),
  async (task_id, { session }) => TaskService.del(task_id, session),
);
