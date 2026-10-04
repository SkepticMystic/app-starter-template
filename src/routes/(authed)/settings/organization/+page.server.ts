import { resolve } from "$app/paths";
import { db } from "#lib/server/db/drizzle.db.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session();
  if (!session.ok) {
    raise(session.error);
  } else if (!session.data.session.org_id) {
    redirect(302, resolve("/(marketing)/onboarding"));
  }

  const [members, invitations] = await Promise.all([
    Repo.query(
      db.query.member.findMany({
        where: { organizationId: session.data.session.org_id },
        columns: {
          id: true,
          role: true,
          createdAt: true,
        },
        with: {
          user: {
            columns: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
    ),
    Repo.query(
      db.query.invitation.findMany({
        where: { organizationId: session.data.session.org_id },
        columns: {
          id: true,
          email: true,
          role: true,
          status: true,
          expiresAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ),
  ]);

  // A failed read is a fault, not an empty organization.
  if (!members.ok) raise(members.error);
  if (!invitations.ok) raise(invitations.error);

  return { members: members.data, invitations: invitations.data };
}) satisfies PageServerLoad;
