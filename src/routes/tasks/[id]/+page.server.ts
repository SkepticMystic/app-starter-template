import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { get_session } from "$lib/services/auth.service";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async ({ params }) => {
  const [session, task] = await Promise.all([
    get_session(),

    Repo.query(
      db.query.task.findFirst({
        where: (task, { eq }) => eq(task.id, params.id),
      }),
    ),
  ]);

  if (!task.ok || !task.data || task.data.org_id !== session.session.org_id) {
    error(404, "Task not found");
  }

  return { task: task.data };
}) satisfies PageServerLoad;
