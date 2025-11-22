import Time from "$lib/components/Time.svelte";
import { renderComponent } from "$lib/components/ui/data-table";
import { TASKS } from "$lib/const/task.const";
import type { Task } from "$lib/server/db/schema/task.models";
import { TanstackTable } from "$lib/utils/tanstack/table.util";

type TData = Task;

export const columns = TanstackTable.make_columns<TData>(({ accessor }) => [
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
]);
