import { resolve } from "$app/paths";
import { AuditQuery } from "#lib/server/services/audit/audit.query.js";
import { AuditPage } from "#lib/server/services/audit/audit_page.util.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async ({ url }) => {
  const session = await get_session();
  if (!session.ok) {
    raise(session.error);
  } else if (!session.data.session.org_id) {
    redirect(302, resolve("/(marketing)/onboarding"));
  }

  const allowed = await get_session({ org_permissions: { audit: ["read"] } });
  if (!allowed.ok) raise(allowed.error);

  const params = AuditPage.params(url);

  const page = await AuditQuery.page(
    {
      where: {
        ...AuditPage.where(params),
        org_id: session.data.session.org_id,
      },
      offset: params.offset,
      limit: params.limit,
    },
    // No address or device: an org admin sees what changed in the org and
    // who did it, not where its members were when they did.
    {
      id: true,
      type: true,
      metadata: true,
      user_id: true,
      actor_user_id: true,
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
