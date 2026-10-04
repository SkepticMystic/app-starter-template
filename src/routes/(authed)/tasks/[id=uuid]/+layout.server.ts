import { resolve } from "$app/paths";
import { db } from "#lib/server/db/drizzle.db.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import { error, redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

/** Shared by the task page and its edit page. */
export const load = (async ({ params }) => {
  const session = await get_session();
  if (!session.ok) {
    raise(session.error);
  } else if (!session.data.session.org_id) {
    redirect(302, resolve("/(marketing)/onboarding"));
  }

  const task = await Repo.query(
    db.query.task.findFirst({
      where: {
        id: params.id,
        org_id: session.data.session.org_id,
      },
      with: {
        assignee: {
          columns: { id: true },
          with: { user: { columns: { name: true, email: true } } },
        },
      },
    }),
  );

  // A failed query is a fault, not a missing task.
  if (!task.ok) raise(task.error);
  if (!task.data) error(404, "Task not found");

  return { task: task.data };
}) satisfies LayoutServerLoad;
