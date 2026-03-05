import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { get_session } from "$lib/server/services/auth.service";
import { result } from "$lib/utils/result.util";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session();

  const [members, invitations] = await Promise.all([
    Repo.query(
      db.query.member.findMany({
        where: { organizationId: session.session.org_id },
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
    ).then((r) => result.unwrap_or(r, [])),
    Repo.query(
      db.query.invitation.findMany({
        where: { organizationId: session.session.org_id },
        columns: {
          id: true,
          email: true,
          role: true,
          status: true,
          expiresAt: true,
        },
      }),
    ).then((r) => result.unwrap_or(r, [])),
  ]);

  return {
    members,
    invitations,
  };
}) satisfies PageServerLoad;
