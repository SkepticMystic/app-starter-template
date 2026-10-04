import { delete_task_remote } from "#lib/remote/tasks/tasks.remote.js";
import { Client } from "./index.client.js";

export const TaskClient = {
  delete: Client.wrap(delete_task_remote, {
    confirm: "Delete this task? This can't be undone.",
    destructive: true,
    action_label: "Delete task",
    suc_msg: "Task deleted",
  }),
};
