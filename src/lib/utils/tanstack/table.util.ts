import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
import { renderComponent } from "$lib/components/ui/data-table";
import DataTableColumnHeaderDropdownMenu from "$lib/components/ui/data-table/data-table-column-header-dropdown-menu.svelte";
import DataTableRowActions from "$lib/components/ui/data-table/data-table-row-actions.svelte";
import { getLocalTimeZone } from "@internationalized/date";
import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  ColumnHelper,
  FilterFn,
  PaginationState,
  Row,
  RowData,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/table-core";
import { createColumnHelper } from "@tanstack/table-core";
import type { DateRange } from "bits-ui";
import type { ComponentProps } from "svelte";
import type { Item } from "../items.util";

const get_column_label = <TData>(column: Column<TData>) =>
  column.columnDef.meta?.label ?? column.id;

const make_columns = <TData extends Item>(
  cb: (
    // NOTE: Specifically _don't_ wrap the helper
    // If we want to add more fields to utils, just `& { fields: ... }` them
    utils: ColumnHelper<TData>,
  ) => {
    selectable?: boolean;
    columns: ColumnDef<TData>[];
    actions?: ComponentProps<DataTableRowActions<TData>>["actions"];
  },
) => {
  const columns: ColumnDef<TData>[] = [];
  const col_helper = createColumnHelper<TData>();

  const input = cb(col_helper);

  if (input.selectable !== false) {
    columns.push(
      col_helper.display({
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

            onCheckedChange: (value) =>
              table.toggleAllPageRowsSelected(!!value),
          }),

        cell: ({ row }) =>
          renderComponent(Checkbox, {
            "aria-label": "Select row",

            checked: row.getIsSelected(),
            onCheckedChange: (value) => row.toggleSelected(!!value),
          }),
      }),
    );
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
    columns.push(
      col_helper.display({
        id: "actions",

        enableHiding: false,
        enableSorting: false,

        cell: ({ row }) =>
          renderComponent(DataTableRowActions<TData>, {
            row,
            actions: input.actions!,
          }),
      }),
    );
  }

  return columns;
};

const filter_fns = {
  // SOURCE: https://tanstack.com/table/latest/docs/guide/column-filtering#custom-filter-functions
  date_range: (<TData extends RowData>(
    row: Row<TData>,
    column_id: string,
    filter: DateRange | undefined,
  ) => {
    if (!filter || !filter.start || !filter.end) return true;

    const value = row.getValue<Date | null | undefined>(column_id);
    if (!value) return false;

    const tz = getLocalTimeZone();

    return value >= filter.start.toDate(tz) && value <= filter.end.toDate(tz);
  }) satisfies FilterFn<RowData>,
};

export type SvelteTableInput<TData extends Item, TValue> = {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];

  faceting?: boolean;

  // state
  states?: {
    sorting?: SortingState | false;
    pagination?: PaginationState | false;
    visibility?: VisibilityState | false;
    selection?: RowSelectionState | false;
    column_filters?: ColumnFiltersState | false;
  };
};

export const TanstackTable = {
  filter_fns,
  make_columns,
  get_column_label,
};
