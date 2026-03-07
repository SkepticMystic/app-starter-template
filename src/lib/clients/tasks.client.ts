import { delete_task_remote } from "$lib/remote/tasks/tasks.remote";
import { Client } from "./index.client";

export const TaskClient = {
  delete: Client.wrap(delete_task_remote),
};
