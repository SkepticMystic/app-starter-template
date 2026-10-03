import { db } from "#lib/server/db/drizzle.db.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async ({ params }) => {
  const session = await get_session();
  if (!session.ok) {
    raise(session.error);
  } else if (!session.data.session.activeOrganizationId) {
    redirect(302, "/onboarding");
  }

  const task = await Repo.query(
    db.query.task.findFirst({
      where: {
        id: params.id,
        org_id: session.data.session.activeOrganizationId,
      },
    }),
  );

  if (!task.ok || !task.data) {
    error(404, "Task not found");
  }

  return { task: task.data };
}) satisfies PageServerLoad;
