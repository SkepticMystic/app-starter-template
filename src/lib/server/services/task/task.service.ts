import { ERROR } from "$lib/const/error.const";
import { db } from "$lib/server/db/drizzle.db";
import { TaskTable, type Task, type TaskSchema } from "$lib/server/db/models/task.model";
import { Repo } from "$lib/server/db/repos/index.repo";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { operators } from "drizzle-orm";
import type { z } from "zod";

const log = Log.child({ service: "task" });

export namespace TaskService {
  export async function create(
    input: z.output<typeof TaskSchema.insert>,
    session: App.Session,
  ): Promise<App.Result<Task>> {
    try {
      if (!session.session.org_id || !session.session.member_id) {
        return result.err(ERROR.FORBIDDEN);
      }

      const task = await Repo.insert_one(
        db
          .insert(TaskTable)
          .values({
            ...input,

            org_id: session.session.org_id,
            user_id: session.session.userId,
            member_id: session.session.member_id,
          })
          .returning(),
      );

      return task;
    } catch (error) {
      log.error(error, "create.error unknown");

      captureException(error, { extra: { input } });

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  export async function update(
    input: z.output<typeof TaskSchema.update>,
    session: App.Session,
  ): Promise<App.Result<Task>> {
    try {
      if (!session.session.org_id) {
        return result.err(ERROR.FORBIDDEN);
      }

      const task = await Repo.update_one(
        db
          .update(TaskTable)
          .set(input)
          .where(
            operators.and(
              operators.eq(TaskTable.id, input.id), //
              operators.eq(TaskTable.org_id, session.session.org_id),
            ),
          )
          .returning(),
      );

      return task;
    } catch (error) {
      log.error(error, "update.error unknown");

      captureException(error, { extra: { input } });

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  export async function del(task_id: string, session: App.Session): Promise<App.Result<void>> {
    try {
      if (!session.session.org_id) {
        return result.err(ERROR.FORBIDDEN);
      }

      const res = await Repo.delete_one(
        db
          .delete(TaskTable)
          .where(
            operators.and(
              operators.eq(TaskTable.id, task_id), //
              operators.eq(TaskTable.org_id, session.session.org_id),
            ),
          )
          .execute(),
      );

      return res;
    } catch (error) {
      log.error(error, "delete.error unknown");

      captureException(error, { extra: { task_id } });

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
}
