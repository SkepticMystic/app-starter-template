import { db } from "#lib/server/db/drizzle.db.js";
import { AuditEventTable } from "#lib/server/db/models/audit.model.js";
import type {
  Columns,
  Every,
  NonEmpty,
  Projected,
} from "#lib/server/db/projection.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { filter_sql } from "#lib/server/db/sql.util.js";
import { result } from "#lib/utils/result.util.js";
import type { TableFilter } from "drizzle-orm";

/** The only write the log has: rows are appended, never changed. */
const insert = (row: typeof AuditEventTable.$inferInsert) =>
  Repo.insert_one(db.insert(AuditEventTable).values(row).returning());

/**
 * Whether `user_id` has signed in before — from `device`, and on or after
 * `since`, when given.
 */
const has_signed_in = (input: {
  user_id: string;
  device?: string;
  since?: Date;
}) =>
  Repo.exists(
    db.query.audit_event.findMany({
      columns: { id: true },
      where: {
        user_id: input.user_id,
        type: "sign_in",
        device: input.device,
        createdAt: input.since ? { gte: input.since } : undefined,
      },
      limit: 1,
    }),
  );

/**
 * One page of the log, newest first, and how many rows the filter matches in
 * all. One `where` for both, so the page and its total cannot disagree. Each
 * view names its own columns: a user's own log never carries the address of
 * the admin who acted on it.
 */
const page = async <const C extends Columns<typeof AuditEventTable>>(
  input: {
    where: TableFilter<typeof AuditEventTable>;
    offset: number;
    limit: number;
  },
  columns: NonEmpty<C>,
): Promise<
  App.Result<{ rows: Projected<typeof AuditEventTable, C>[]; total: number }>
> => {
  const [rows, total] = await Promise.all([
    Repo.query(
      db.query.audit_event.findMany({
        // Widened, since drizzle cannot infer through a generic `columns`; the
        // declared return type narrows the rows back to `C`.
        columns: columns as Every<typeof AuditEventTable>,
        where: input.where,
        // `t`, not `AuditEventTable`: findMany aliases the table.
        orderBy: (t) =>
          Repo.order_by(
            { key: "createdAt", desc: true },
            { createdAt: t.createdAt },
            t.id,
          ),
        limit: input.limit,
        offset: input.offset,
      }),
    ),
    Repo.count(
      db.$count(AuditEventTable, filter_sql(AuditEventTable, input.where)),
    ),
  ]);
  if (!rows.ok) return rows;
  if (!total.ok) return total;

  return result.suc({ rows: rows.data, total: total.data });
};

/**
 * The people a page of events names, by id, for the views that show who acted
 * on whom. A deleted actor is simply absent.
 */
const people = async (
  ids: (string | null)[],
): Promise<App.Result<Map<string, { name: string; email: string }>>> => {
  const unique = [...new Set(ids.filter((id): id is string => id !== null))];
  if (!unique.length) return result.suc(new Map());

  const users = await Repo.query(
    db.query.user.findMany({
      columns: { id: true, name: true, email: true },
      where: { id: { in: unique } },
    }),
  );
  if (!users.ok) return users;

  return result.suc(new Map(users.data.map(({ id, ...user }) => [id, user])));
};

export const AuditQuery = {
  insert,
  has_signed_in,
  page,
  people,
};
