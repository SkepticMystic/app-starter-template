import { Checkbox } from "$lib/components/ui/checkbox";
import { renderComponent } from "$lib/components/ui/data-table";
import DataTableRowActions from "$lib/components/ui/data-table/data-table-row-actions.svelte";
import DataTableSortHeader from "$lib/components/ui/data-table/data-table-sort-header.svelte";
import { TASKS } from "$lib/const/task.const";
import { delete_task, get_tasks } from "$lib/remote/tasks.remote";
import type { Task } from "$lib/server/db/schema/task.models";
import { Dates } from "$lib/utils/dates";
import { Items } from "$lib/utils/items.util";
import type { ColumnDef } from "@tanstack/table-core";
import { toast } from "svelte-sonner";

export const columns: ColumnDef<Task>[] = [
  {
    id: "select",

    enableHiding: false,
    enableSorting: false,

    header: ({ table }) =>
      renderComponent(Checkbox, {
        "aria-label": "Select all",

        checked: table.getIsAllPageRowsSelected(),
        indeterminate:
          table.getIsSomePageRowsSelected() &&
          !table.getIsAllPageRowsSelected(),

        onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
      }),

    cell: ({ row }) =>
      renderComponent(Checkbox, {
        "aria-label": "Select row",

        checked: row.getIsSelected(),
        onCheckedChange: (value) => row.toggleSelected(!!value),
      }),
  },

  {
    accessorKey: "status",
    header: ({ column }) =>
      renderComponent(DataTableSortHeader, {
        label: "Status",
        sort_dir: column.getIsSorted(),
        onclick: column.getToggleSortingHandler(),
      }),

    cell: ({ row }) =>
      TASKS.STATUS.MAP[row.original.status]?.label || "Unknown",
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "due_date",
    header: ({ column }) =>
      renderComponent(DataTableSortHeader, {
        label: "Due date",
        sort_dir: column.getIsSorted(),
        onclick: column.getToggleSortingHandler(),
      }),

    cell: ({ row }) =>
      row.original.due_date
        ? Dates.show_date(row.original.due_date)
        : "No due date",
  },

  {
    id: "actions",

    enableHiding: false,
    enableSorting: false,

    cell: ({ row }) => {
      return renderComponent(DataTableRowActions, {
        row: row.original,
        actions: [
          {
            kind: "item",
            title: "Copy task ID",
            icon: "lucide/copy",
            onclick: (data) => navigator.clipboard.writeText(data.id),
          },
          {
            kind: "item",
            title: "Delete task",
            icon: "lucide/trash-2",
            variant: "destructive",
            onclick: (task) => {
              try {
                delete_task(task.id)
                  .updates(
                    get_tasks({}).withOverride((old) =>
                      Items.remove(old, task.id),
                    ),
                  )
                  .then(() => {
                    toast.success("Task deleted");
                  });
              } catch (error) {
                console.log("Error deleting task", error);
                toast.error("Error deleting task");
              }
            },
          },
        ],
      });
    },
  },
];
