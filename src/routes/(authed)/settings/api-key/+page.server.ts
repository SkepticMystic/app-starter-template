import { db } from "#lib/server/db/drizzle.db.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session();
  if (!session.ok) {
    error(session.error.status ?? 401, session.error.message, session.error);
  } else if (!session.data.session.org_id) {
    redirect(302, "/onboarding");
  }

  const apikeys = await Repo.query(
    db.query.apikey.findMany({
      where: { referenceId: session.data.session.org_id },
      columns: {
        id: true,
        name: true,
        start: true,
        enabled: true,
        createdAt: true,
        expiresAt: true,
        lastRequest: true,
      },
    }),
  );

  if (!apikeys.ok) {
    error(apikeys.error.status ?? 500, apikeys.error.message, apikeys.error);
  }

  return {
    apikeys: apikeys.data,
  };
}) satisfies PageServerLoad;
