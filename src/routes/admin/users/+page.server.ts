import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { get_session } from "$lib/services/auth.service";
import { result } from "$lib/utils/result.util";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const [_admin, users] = await Promise.all([
    get_session({ admin: true }),

    Repo.query(
      db.query.user.findMany({
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      }),
    ).then((r) => result.unwrap_or(r, [])),
  ]);

  return { users };
}) satisfies PageServerLoad;
