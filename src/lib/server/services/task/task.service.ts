import { ERROR } from "$lib/const/error.const";
import { ServiceUtil } from "$lib/server/services/service.util";
import { db } from "$lib/server/db/drizzle.db";
import {
  TaskSchema,
  TaskTable,
  type Task,
} from "$lib/server/db/models/task.model";
import { Repo } from "$lib/server/db/repos/index.repo";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { operators } from "drizzle-orm";
import type { z } from "zod";

const log = Log.child({ service: "task" });

export namespace TaskService {
  export async function create(
    input: z.output<typeof TaskSchema.insert>,
    session: App.Session,
  ): Promise<App.Result<Task>> {
    try {
      const org = ServiceUtil.session_org(session);
      if (!org.ok) return org;

      const member = ServiceUtil.session_member(session);
      if (!member.ok) return member;

      const task = await Repo.insert_one(
        db
          .insert(TaskTable)
          .values({
            ...input,

            org_id: org.data,
            user_id: session.session.userId,
            member_id: member.data,
          })
          .returning(),
      );

      return task;
    } catch (error) {
      return ServiceUtil.internal(error, {
        log,
        scope: "create",
        extra: { input },
      });
    }
  }

  export async function update(
    input: z.output<typeof TaskSchema.update>,
    session: App.Session,
  ): Promise<App.Result<Task>> {
    try {
      const org = ServiceUtil.session_org(session);
      if (!org.ok) return org;

      const task = await Repo.update_one(
        db
          .update(TaskTable)
          .set(TaskSchema.patch(input))
          .where(
            operators.and(
              operators.eq(TaskTable.id, input.id), //
              operators.eq(TaskTable.org_id, org.data),
            ),
          )
          .returning(),
      );

      return task;
    } catch (error) {
      return ServiceUtil.internal(error, {
        log,
        scope: "update",
        extra: { input },
      });
    }
  }

  export async function del(
    task_id: string,
    session: App.Session,
  ): Promise<App.Result<void>> {
    try {
      const org = ServiceUtil.session_org(session);
      if (!org.ok) return org;

      const res = await Repo.delete_one(
        db
          .delete(TaskTable)
          .where(
            operators.and(
              operators.eq(TaskTable.id, task_id), //
              operators.eq(TaskTable.org_id, org.data),
            ),
          )
          .execute(),
      );

      return res;
    } catch (error) {
      return ServiceUtil.internal(error, {
        log,
        scope: "delete",
        extra: { task_id },
      });
    }
  }
}
