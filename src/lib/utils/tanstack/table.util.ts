import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
import { renderComponent } from "$lib/components/ui/data-table";
import DataTableColumnHeaderDropdownMenu from "$lib/components/ui/data-table/data-table-column-header-dropdown-menu.svelte";
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

  columns.push(
    ...input.columns.map((col) => {
      // Enable HeaderDropdown by default, unless both of its purposes are explicitly disabled
      if (col.enableSorting !== false && col.enableHiding !== false) {
        col.header = ({ column }) =>
          renderComponent(DataTableColumnHeaderDropdownMenu<TData>, { column });
      }

      return col;
    }),
  );

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
