import { db } from "#lib/server/db/drizzle.db.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { raise, result } from "#lib/utils/result.util.js";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session({ admin: true });
  if (!session.ok) {
    raise(session.error);
  }

  const users = await Repo.query(
    db.query.user.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ).then((r) => result.unwrap_or(r, []));

  return { users };
}) satisfies PageServerLoad;
