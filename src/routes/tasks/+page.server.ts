import { TaskSchema } from "$lib/schema/task.schema.js";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { PageServerLoad } from "./$types";

export const load = (async ({}) => {
  const form_input = await superValidate(zod4(TaskSchema.create));

  return {
    form_input,
  };
}) satisfies PageServerLoad;
