import type { DropdownMenuItemInput } from "$lib/components/ui/dropdown-menu/dropdown-menu.types";
import "@tanstack/table-core";
import type {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  GroupingState,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/table-core";

export type TanstackTableInput<TData extends Record<string, unknown>> = {
  data: TData[];
  // NOTE: I've tried many things, and this is all that works...
  // Creating the columns is still type-safe with columnHelper
  // One downside of `any` here is that the children(table) snippet loses TValue type-safety
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  actions?: (row: Row<TData>) => DropdownMenuItemInput[];
  bulk_actions?: (rows: Row<TData>[]) => DropdownMenuItemInput[];

  faceting?: boolean;

  // state
  states?: {
    selection?: RowSelectionState;
    sorting?: SortingState | false;
    grouping?: GroupingState | false;
    expanded?: ExpandedState | false;
    pagination?: PaginationState | false;
    visibility?: VisibilityState | false;
    column_filters?: ColumnFiltersState | false;
  };
};

declare module "@tanstack/table-core" {
  interface ColumnMeta<_TData extends RowData, _TValue> {
    /** NOTE: Use when passing a snippet/component to `header`
     * (In this case, column.columnDef.header is a big html mess)
     */
    label?: string;
  }
}
