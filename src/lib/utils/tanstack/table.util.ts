import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
import { renderComponent } from "$lib/components/ui/data-table";
import DataTableRowActions from "$lib/components/ui/data-table/data-table-row-actions.svelte";
import type { Column, ColumnDef } from "@tanstack/table-core";
import type { ComponentProps } from "svelte";
import type { Item } from "../items.util";

const get_column_label = <TData>(column: Column<TData>) =>
  column.columnDef.meta?.label ?? column.id;

const make_columns = <TData extends Item>(input: {
  selectable?: boolean;
  columns: ColumnDef<TData>[];
  actions?: ComponentProps<DataTableRowActions<TData>>["actions"];
}) => {
  const columns: ColumnDef<TData>[] = [];

  if (input.selectable !== false) {
    columns.push({
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
    });
  }

  columns.push(...input.columns);

  if (input.actions) {
    columns.push({
      id: "actions",

      enableHiding: false,
      enableSorting: false,

      cell: ({ row }) =>
        renderComponent(DataTableRowActions<TData>, {
          row,
          actions: input.actions!,
        }),
    });
  }

  return columns;
};

export const TanstackTable = {
  make_columns,
  get_column_label,
};
