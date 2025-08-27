import { get_session } from "$lib/auth/server";
import { db } from "$lib/server/db/drizzle.db";
import type { PageServerLoad } from "./$types";

export const load = (async ({ request }) => {
  const [_admin, users] = await Promise.all([
    get_session(request, { admin: true }),
    db.query.user.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    }),
  ]);

  return { users };
}) satisfies PageServerLoad;
