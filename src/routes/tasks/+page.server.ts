import { get_session } from "$lib/auth/server";
import { TaskSchema } from "$lib/schema/task.schema.js";
import { db } from "$lib/server/db/drizzle.db";
import { TaskTable } from "$lib/server/db/schema/task.models";
import { Log } from "$lib/utils/logger.util";
import { err } from "$lib/utils/result.util";
import { redirect, type Actions } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { PageServerLoad } from "./$types";

export const load = (async ({}) => {
  const form_input = await superValidate(zod4(TaskSchema.create));

  return {
    form_input,
  };
}) satisfies PageServerLoad;

export const actions = {
  "create-task": async ({ request }) => {
    const [session, form] = await Promise.all([
      get_session(),
      superValidate(request, zod4(TaskSchema.create)),
    ]);
    console.log(form);

    if (!form.valid) {
      return message(form, err());
    }

    let task_id: string | null = null;

    try {
      const [task] = await db
        .insert(TaskTable)
        .values({
          ...form.data,

          user_id: session.user.id,
          org_id: session.session.org_id,
          member_id: session.session.member_id,
        })
        .returning({ id: TaskTable.id });

      task_id = task.id;
    } catch (error) {
      Log.error(error, "Error creating task");

      return message(form, err("Failed to create task"));
    }

    redirect(303, `/tasks/${task_id}`);
  },
} satisfies Actions;
