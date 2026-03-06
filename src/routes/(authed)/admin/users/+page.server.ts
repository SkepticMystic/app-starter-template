import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { get_session } from "$lib/server/services/auth.service";
import { result } from "$lib/utils/result.util";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session({ admin: true });
  if (!session.ok) {
    error(session.error.status ?? 401, session.error);
  }

  const users = await Repo.query(
    db.query.user.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    }),
  ).then((r) => result.unwrap_or(r, []));

  return { users };
}) satisfies PageServerLoad;
