import { resolve } from "$app/paths";
import { TASKS } from "#lib/const/task.const.js";
import { db } from "#lib/server/db/drizzle.db.js";
import { TaskTable } from "#lib/server/db/models/task.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import { redirect } from "@sveltejs/kit";
import { TIME } from "#lib/const/time.const.js";
import { parseDate } from "@internationalized/date";
import { and, eq, gte, ilike, inArray, lt } from "drizzle-orm";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/**
 * The params `DataTable`'s server mode writes: one per filter id, `status` once
 * per value, and `offset`/`limit`. Each `.catch`es to its default, so a
 * hand-edited URL renders the unfiltered first page rather than an error.
 */
const params_schema = z.object({
  title: z.string().trim().max(255).catch(""),
  status: z.array(z.enum(TASKS.STATUS.IDS)).catch([]),
  // `YYYY-MM-DD`, both ends inclusive; a half or malformed range is ignored.
  due_date_from: z.iso.date().nullable().catch(null),
  due_date_to: z.iso.date().nullable().catch(null),
  offset: z.coerce.number().int().min(0).catch(0),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .catch(DEFAULT_LIMIT)
    .transform((limit) => Math.min(limit, MAX_LIMIT)),
});

export const load = (async ({ url, depends }) => {
  depends("app:tasks");

  const session = await get_session();
  if (!session.ok) {
    raise(session.error);
  } else if (!session.data.session.org_id) {
    redirect(302, resolve("/(marketing)/onboarding"));
  }

  const params = params_schema.parse({
    title: url.searchParams.get("title") ?? "",
    status: url.searchParams.getAll("status"),
    due_date_from: url.searchParams.get("due_date_from"),
    due_date_to: url.searchParams.get("due_date_to"),
    offset: url.searchParams.get("offset") ?? 0,
    limit: url.searchParams.get("limit") ?? DEFAULT_LIMIT,
  });

  // Calendar days in the app's zone, up to the start of the day after `to`.
  const due =
    params.due_date_from && params.due_date_to
      ? {
          from: parseDate(params.due_date_from).toDate(TIME.ZONE),
          until: parseDate(params.due_date_to)
            .add({ days: 1 })
            .toDate(TIME.ZONE),
        }
      : null;

  const where = and(
    eq(TaskTable.org_id, session.data.session.org_id),
    params.title
      ? ilike(TaskTable.title, Repo.contains(params.title))
      : undefined,
    params.status.length ? inArray(TaskTable.status, params.status) : undefined,
    due ? gte(TaskTable.due_date, due.from) : undefined,
    due ? lt(TaskTable.due_date, due.until) : undefined,
  );

  const [tasks, total] = await Promise.all([
    Repo.query(
      db
        .select()
        .from(TaskTable)
        .where(where)
        // Fixed: server mode turns column sorting off.
        .orderBy(
          ...Repo.order_by(
            { key: "createdAt", desc: true },
            { createdAt: TaskTable.createdAt },
            TaskTable.id,
          ),
        )
        .limit(params.limit)
        .offset(params.offset),
    ),
    Repo.count(db.$count(TaskTable, where)),
  ]);

  if (!tasks.ok) raise(tasks.error);
  if (!total.ok) raise(total.error);

  return {
    tasks: tasks.data,
    total: total.data,
    offset: params.offset,
    limit: params.limit,
  };
}) satisfies PageServerLoad;
