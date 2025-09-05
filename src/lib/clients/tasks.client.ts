import { create_task, get_tasks } from "$lib/remote/tasks.remote";
import type { TaskSchema } from "$lib/schema/task.schema";
import type { Task } from "$lib/server/db/schema/task.models";
import type { Infer } from "sveltekit-superforms";
import { Client } from "./index.client";

export const TaskClient = {
  // effect_create: (task: NewTask) =>
  //   Effect.runPromise(
  //     pipe(
  //       Effect.tryPromise({
  //         try: () => create_task(task),
  //         catch: (error) => {
  //           console.error("Failed to create task:", error);
  //           throw error;
  //         },
  //       }),
  //       Effect.timeout("1 second"),
  //       Effect.retry({ times: 3, schedule: Schedule.exponential(1_000) }),
  //       Effect.tap((e) => Effect.log("tap", e)),
  //     ),
  //   ).catch((error) => {
  //     console.error("All attempts to create task failed:", error);
  //     throw error;
  //   }),

  create: (task: Infer<typeof TaskSchema.create>) =>
    Client.request(
      () =>
        create_task(task).updates(
          get_tasks({}).withOverride((tasks) => [
            { ...task, createdAt: new Date() } as Task,
            ...tasks,
          ]),
        ),
      { toast: { optimistic: true, success: "Task created" } },
    ),
};
