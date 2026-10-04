import { db } from "#lib/server/db/drizzle.db.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session({ admin: true });
  if (!session.ok) {
    raise(session.error);
  }

  const orgs = await Repo.query(
    db.query.organization.findMany({
      orderBy: { createdAt: "desc" },

      columns: {
        id: true,
        name: true,
        createdAt: true,
      },

      with: {
        members: {
          columns: { id: true },
        },
      },
    }),
  );
  if (!orgs.ok) raise(orgs.error);

  return { orgs: orgs.data };
}) satisfies PageServerLoad;
