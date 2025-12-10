import {
  delete_task_remote,
  get_all_tasks_remote,
} from "$lib/remote/tasks/tasks.remote";
import { Items } from "$lib/utils/items.util";
import { Client } from "./index.client";

export const TaskClient = {
  delete: Client.wrap(
    (input: Parameters<typeof delete_task_remote>[0]) =>
      delete_task_remote(input).updates(
        get_all_tasks_remote().withOverride((tasks) =>
          Items.remove(tasks, input),
        ),
      ),
    { optimistic: true },
  ),
};
