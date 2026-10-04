import { AuditQuery } from "#lib/server/services/audit/audit.query.js";
import { AuditPage } from "#lib/server/services/audit/audit_page.util.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import type { PageServerLoad } from "./$types";

export const load = (async ({ url }) => {
  const session = await get_session();
  if (!session.ok) raise(session.error);

  const params = AuditPage.params(url);

  const page = await AuditQuery.page(
    {
      where: { ...AuditPage.where(params), user_id: session.data.user.id },
      offset: params.offset,
      limit: params.limit,
    },
    {
      id: true,
      type: true,
      metadata: true,
      actor_user_id: true,
      device: true,
      country: true,
      ip: true,
      createdAt: true,
    },
  );
  if (!page.ok) raise(page.error);

  return {
    // Whether someone else acted, never who: an admin's or an owner's
    // identity is not this page's to show.
    events: page.data.rows.map(({ actor_user_id, ...row }) => ({
      ...row,
      by_other: actor_user_id !== null,
    })),
    total: page.data.total,
    offset: params.offset,
    limit: params.limit,
  };
}) satisfies PageServerLoad;
