import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { get_session } from "$lib/services/auth.service";
import { result } from "$lib/utils/result.util";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const [_admin, orgs] = await Promise.all([
    get_session({ admin: true }),

    Repo.query(
      db.query.organization.findMany({
        orderBy: (orgs, { desc }) => [desc(orgs.createdAt)],

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
    ).then((r) => result.unwrap_or(r, [])),
  ]);

  return { orgs };
}) satisfies PageServerLoad;
