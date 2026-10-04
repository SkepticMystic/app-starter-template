import { db } from "#lib/server/db/drizzle.db.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { AuditQuery } from "#lib/server/services/audit/audit.query.js";
import { AuditPage } from "#lib/server/services/audit/audit_page.util.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import type { PageServerLoad } from "./$types";

/** How many accounts an address search may match before it is too broad to filter by. */
const MAX_MATCHED_ACCOUNTS = 100;

export const load = (async ({ url }) => {
  const session = await get_session({ admin: true });
  if (!session.ok) raise(session.error);

  const params = AuditPage.params(url);

  // The log keeps ids, not addresses, so a search resolves to accounts first.
  // `in: []` matches nothing, which is the right answer for no account.
  let user_ids: string[] | undefined;
  if (params.email) {
    const matched = await Repo.query(
      db.query.user.findMany({
        columns: { id: true },
        where: { email: { ilike: Repo.contains(params.email) } },
        limit: MAX_MATCHED_ACCOUNTS,
      }),
    );
    if (!matched.ok) raise(matched.error);

    user_ids = matched.data.map((user) => user.id);
  }

  const page = await AuditQuery.page(
    {
      where: {
        ...AuditPage.where(params),
        user_id: user_ids ? { in: user_ids } : undefined,
      },
      offset: params.offset,
      limit: params.limit,
    },
    {
      id: true,
      type: true,
      metadata: true,
      user_id: true,
      actor_user_id: true,
      device: true,
      country: true,
      ip: true,
      createdAt: true,
    },
  );
  if (!page.ok) raise(page.error);

  const people = await AuditQuery.people(
    page.data.rows.flatMap((row) => [row.user_id, row.actor_user_id]),
  );
  if (!people.ok) raise(people.error);

  return {
    events: page.data.rows.map(({ user_id, actor_user_id, ...row }) => ({
      ...row,
      subject: user_id ? (people.data.get(user_id) ?? null) : null,
      actor: actor_user_id ? (people.data.get(actor_user_id) ?? null) : null,
    })),
    total: page.data.total,
    offset: params.offset,
    limit: params.limit,
  };
}) satisfies PageServerLoad;
