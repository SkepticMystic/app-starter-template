import { Client } from "$lib/clients/index.client";
import Time from "$lib/components/Time.svelte";
import { renderComponent } from "$lib/components/ui/data-table";
import { TASKS } from "$lib/const/task.const";
import { delete_task, get_tasks } from "$lib/remote/tasks.remote";
import type { Task } from "$lib/server/db/schema/task.models";
import { Items } from "$lib/utils/items.util";
import { TanstackTable } from "$lib/utils/tanstack/table.util";
import { getLocalTimeZone } from "@internationalized/date";
import type { DateRange } from "bits-ui";

type TData = Task;

export const columns = TanstackTable.make_columns<TData>({
  columns: [
    {
      accessorKey: "status",
      meta: { label: "Status" },

      filterFn: "arrIncludesSome",

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

      // SOURCE: https://tanstack.com/table/latest/docs/guide/column-filtering#custom-filter-functions
      filterFn: (row, column_id, filter: DateRange | undefined) => {
        if (!filter || !filter.start || !filter.end) return true;

        const due_date = row.getValue<Task["due_date"]>(column_id);
        if (!due_date) return false;

        return (
          due_date >= filter.start.toDate(getLocalTimeZone()) &&
          due_date <= filter.end.toDate(getLocalTimeZone())
        );
      },

      cell: ({ row }) =>
        renderComponent(Time, {
          show: "datetime",
          date: row.original.due_date,
        }),
    },
    {
      accessorKey: "createdAt",
      meta: { label: "Created" },

      cell: ({ row }) =>
        renderComponent(Time, { date: row.original.createdAt }),
    },
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
          {
            toast: { optimistic: true, success: "Task deleted" },
          },
        ),
    },
  ],
});
