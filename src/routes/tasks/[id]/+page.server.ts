import { get_session } from "$lib/auth/server";
import { db } from "$lib/server/db/drizzle.db";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async ({ params }) => {
  const [session, task] = await Promise.all([
    get_session(),
    db.query.task.findFirst({
      where: (task, { eq }) => eq(task.id, params.id),
    }),
  ]);

  if (!task || task.org_id !== session.session.org_id) {
    error(404, "Task not found");
  }

  return { task };
}) satisfies PageServerLoad;
