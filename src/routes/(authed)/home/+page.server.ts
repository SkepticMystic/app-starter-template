import { resolve } from "$app/paths";
import { db } from "#lib/server/db/drizzle.db.js";
import { MemberTable } from "#lib/server/db/models/auth.model.js";
import { TaskTable } from "#lib/server/db/models/task.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { count_where } from "#lib/server/db/sql.util.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import { redirect } from "@sveltejs/kit";
import { eq, inArray, lt, sql } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

const OPEN = ["pending", "in_progress"] as const;

export const load = (async () => {
  const session = await get_session();
  if (!session.ok) {
    raise(session.error);
  } else if (!session.data.session.org_id) {
    redirect(302, resolve("/(marketing)/onboarding"));
  }

  const org_id = session.data.session.org_id;
  const open = inArray(TaskTable.status, OPEN);
  const overdue = sql`${open} and ${lt(TaskTable.due_date, new Date())}`;

  // One statement, so a page load holds one pooled connection rather than
  // three. An aggregate with no GROUP BY answers one row even for an org with
  // no tasks, so `stats` is only absent if Postgres broke that promise.
  const res = await Repo.query(
    db
      .select({
        open: count_where(open),
        overdue: count_where(overdue),
        members: db.$count(MemberTable, eq(MemberTable.organizationId, org_id)),
      })
      .from(TaskTable)
      .where(eq(TaskTable.org_id, org_id)),
  );
  if (!res.ok) raise(res.error);

  const [stats] = res.data;

  return {
    stats: {
      open: stats?.open ?? 0,
      overdue: stats?.overdue ?? 0,
      members: stats?.members ?? 0,
    },
  };
}) satisfies PageServerLoad;
