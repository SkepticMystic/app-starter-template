import { resolve } from "$app/paths";
import { db } from "#lib/server/db/drizzle.db.js";
import { MemberTable } from "#lib/server/db/models/auth.model.js";
import { TaskTable } from "#lib/server/db/models/task.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import { redirect } from "@sveltejs/kit";
import { and, eq, inArray, lt } from "drizzle-orm";
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
  const open = and(
    eq(TaskTable.org_id, org_id),
    inArray(TaskTable.status, OPEN),
  );

  const [open_count, overdue_count, member_count] = await Promise.all([
    Repo.count(db.$count(TaskTable, open)),
    Repo.count(
      db.$count(TaskTable, and(open, lt(TaskTable.due_date, new Date()))),
    ),
    Repo.count(db.$count(MemberTable, eq(MemberTable.organizationId, org_id))),
  ]);
  if (!open_count.ok) raise(open_count.error);
  if (!overdue_count.ok) raise(overdue_count.error);
  if (!member_count.ok) raise(member_count.error);

  return {
    stats: {
      open: open_count.data,
      overdue: overdue_count.data,
      members: member_count.data,
    },
  };
}) satisfies PageServerLoad;
