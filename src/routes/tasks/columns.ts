import { TASKS } from "$lib/const/task.const";
import { delete_task, get_tasks } from "$lib/remote/tasks.remote";
import type { Task } from "$lib/server/db/schema/task.models";
import { Dates } from "$lib/utils/dates";
import { Items } from "$lib/utils/items.util";
import { TanstackTable } from "$lib/utils/tanstack/table.util";
import { toast } from "svelte-sonner";

type TData = Task;

export const columns = TanstackTable.make_columns<TData>({
  columns: [
    {
      accessorKey: "status",
      meta: { label: "Status" },

      cell: ({ row }) =>
        TASKS.STATUS.MAP[row.original.status]?.label || "Unknown",
    },
    {
      accessorKey: "title",
      meta: { label: "Title" },
    },
    {
      accessorKey: "due_date",
      meta: { label: "Due date" },

      cell: ({ row }) =>
        row.original.due_date
          ? Dates.show_date(row.original.due_date)
          : "No due date",
    },
  ],

  actions: [
    {
      kind: "item",
      title: "Copy task ID",
      icon: "lucide/copy",
      onclick: (row) => navigator.clipboard.writeText(row.original.id),
    },
    {
      kind: "item",
      title: "Delete task",
      icon: "lucide/trash-2",
      variant: "destructive",
      onclick: async (row) => {
        const toast_id = toast.success("Task deleted");

        try {
          await delete_task(row.original.id).updates(
            get_tasks({}).withOverride((old) =>
              Items.remove(old, row.original.id),
            ),
          );
        } catch (error) {
          console.log("Error deleting task", error);
          toast.error("Error deleting task", { id: toast_id });
        }
      },
    },
  ],
});
