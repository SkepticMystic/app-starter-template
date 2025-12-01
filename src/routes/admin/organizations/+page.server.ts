import { get_session } from "$lib/services/auth.service";
import { db } from "$lib/server/db/drizzle.db";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const [_admin, orgs] = await Promise.all([
    get_session({ admin: true }),
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
  ]);

  return { orgs };
}) satisfies PageServerLoad;
