import { resolve } from "$app/paths";
import { db } from "#lib/server/db/drizzle.db.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session();
  if (!session.ok) {
    raise(session.error);
  } else if (!session.data.session.org_id) {
    redirect(302, resolve("/(marketing)/onboarding"));
  }

  const allowed = await get_session({ org_permissions: { apiKey: ["read"] } });
  if (!allowed.ok) raise(allowed.error);

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
      orderBy: { createdAt: "desc" },
    }),
  );

  if (!apikeys.ok) {
    raise(apikeys.error);
  }

  return {
    apikeys: apikeys.data,
  };
}) satisfies PageServerLoad;
