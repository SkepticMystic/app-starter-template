import { ERROR } from "#lib/const/error.const.js";
import { ServiceUtil } from "#lib/server/services/service.util.js";
import { db } from "#lib/server/db/drizzle.db.js";
import { MemberTable } from "#lib/server/db/models/auth.model.js";
import {
  TaskSchema,
  TaskTable,
  type Task,
} from "#lib/server/db/models/task.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { operators } from "drizzle-orm";
import type { z } from "zod";

const log = Log.child({ service: "task" });

/**
 * `assigned_member_id` is only a uuid to the schema, and the foreign key only
 * proves the member exists — in *some* org. Without this, a caller could assign
 * a task to another org's member, and every read that joins the assignee would
 * leak that member's name across the tenant boundary.
 */
const check_assignee = async (
  org_id: string,
  assigned_member_id: string | null | undefined,
): Promise<App.Result<void>> => {
  if (!assigned_member_id) return result.suc(undefined);

  const found = await Repo.exists(
    db
      .select({ id: MemberTable.id })
      .from(MemberTable)
      .where(
        operators.and(
          operators.eq(MemberTable.id, assigned_member_id),
          operators.eq(MemberTable.organizationId, org_id),
        ),
      )
      .limit(1),
  );
  if (!found.ok) return found;

  return found.data
    ? result.suc(undefined)
    : result.err({
        ...ERROR.INVALID_INPUT,
        message: "Assign the task to a member of this organization.",
        path: ["assigned_member_id"],
      });
};

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

      const assignee = await check_assignee(org.data, input.assigned_member_id);
      if (!assignee.ok) return assignee;

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

      const assignee = await check_assignee(org.data, input.assigned_member_id);
      if (!assignee.ok) return assignee;

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
        extra: { task_id: input.id },
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
