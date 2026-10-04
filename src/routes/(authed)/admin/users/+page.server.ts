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

  const users = await Repo.query(
    db.query.user.findMany({
      // What the table shows, and nothing else of the user row.
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  );
  if (!users.ok) raise(users.error);

  return { users: users.data, self_id: session.data.user.id };
}) satisfies PageServerLoad;
