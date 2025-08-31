import { form, getRequestEvent, query } from "$app/server";
import { get_session } from "$lib/auth/server";
import { TASKS } from "$lib/const/task.const";
import { TaskSchema } from "$lib/schema/task.schema";
import { db } from "$lib/server/db/drizzle.db";
import { TaskTable } from "$lib/server/db/schema/task.models";
import { error, redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import z from "zod";

export const get_tasks = query(
  z.object({
    status: z.enum(TASKS.STATUS.IDS).optional(),
  }),
  async (input) => {
    const session = await get_session();

    const tasks = await db.query.task.findMany({
      where: (task, { eq, and }) =>
        and(
          eq(task.org_id, session.session.org_id),
          input.status ? eq(task.status, input.status) : undefined,
        ),

      columns: {
        id: true,
        title: true,
        status: true,
        due_date: true,
        member_id: true,
        description: true,
        assigned_member_id: true,

        createdAt: true,
        updatedAt: true,
      },
    });

    return tasks;
  },
);

export const create_task = form(async () => {
  const request = getRequestEvent();

  const [session, form] = await Promise.all([
    get_session(),
    superValidate(request, zod4(TaskSchema.create)),
  ]);
  console.log(form);

  if (!form.valid) {
    error(400, form.errors._errors?.join(", ") || "Invalid form data");
  }

  const [task] = await db
    .insert(TaskTable)
    .values({
      ...form.data,

      user_id: session.user.id,
      member_id: session.session.member_id,
      org_id: session.session.org_id,
    })
    .returning({ id: TaskTable.id });

  redirect(303, `/tasks/${task.id}`);
});
