import { Client } from "$lib/clients/index.client";
import Time from "$lib/components/Time.svelte";
import { renderComponent } from "$lib/components/ui/data-table";
import { TASKS } from "$lib/const/task.const";
import { delete_task, get_tasks } from "$lib/remote/tasks/tasks.remote";
import type { Task } from "$lib/server/db/schema/task.models";
import { Items } from "$lib/utils/items.util";
import { TanstackTable } from "$lib/utils/tanstack/table.util";

type TData = Task;

export const columns = TanstackTable.make_columns<TData>(({ accessor }) => ({
  columns: [
    accessor("status", {
      meta: { label: "Status" },

      filterFn: "arrIncludesSome",

      cell: ({ getValue }) => TASKS.STATUS.MAP[getValue()]?.label || "Unknown",
    }),

    accessor("title", {
      meta: { label: "Title" },
    }),

    accessor("due_date", {
      meta: { label: "Due date" },

      filterFn: TanstackTable.filter_fns.date_range,

      cell: ({ getValue }) =>
        renderComponent(Time, { show: "datetime", date: getValue() }),
    }),
    accessor("createdAt", {
      meta: { label: "Created" },

      cell: ({ getValue }) => renderComponent(Time, { date: getValue() }),
    }),
  ],

  actions: [
    {
      kind: "item",
      title: "Copy task ID",
      icon: "lucide/copy",
      onselect: (row) => navigator.clipboard.writeText(row.original.id),
    },
    {
      kind: "item",
      title: "Delete task",
      icon: "lucide/trash-2",
      onselect: (row) =>
        Client.request(
          () =>
            delete_task(row.original.id).updates(
              get_tasks({}).withOverride((old) =>
                Items.remove(old, row.original.id),
              ),
            ),
          { toast: { optimistic: true, success: "Task deleted" } },
        ),
    },
  ],
}));
