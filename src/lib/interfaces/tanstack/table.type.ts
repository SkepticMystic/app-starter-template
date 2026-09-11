import type { DropdownMenuItemInput } from "$lib/components/ui/dropdown-menu/dropdown-menu.types";
import type { Features } from "$lib/utils/tanstack/table.util";
import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnVisibilityState,
  ExpandedState,
  GroupingState,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
} from "@tanstack/svelte-table";

/**
 * How the table keys its rows. This is the key `RowSelectionState` is written
 * against, which is why it has to be a prop: a list keyed on something other
 * than `id` selects the wrong rows otherwise.
 */
export type TanstackTableRowId<TData> = (
  original: TData,
  index: number,
) => string;

export type TanstackTableInput<TData extends Record<string, unknown>> = {
  data: TData[];
  // NOTE: I've tried many things, and this is all that works...
  // Creating the columns is still type-safe with column_helper
  // One downside of `any` here is that the children(table) snippet loses TValue type-safety
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<Features, TData, any>[];
  actions?: (row: Row<Features, TData>) => DropdownMenuItemInput[];
  bulk_actions?: (rows: Row<Features, TData>[]) => DropdownMenuItemInput[];

  /** Defaults to the row's own `id`, then its index. */
  get_row_id?: TanstackTableRowId<TData>;

  // state
  states?: {
    selection?: RowSelectionState;
    sorting?: SortingState | false;
    grouping?: GroupingState | false;
    expanded?: ExpandedState | false;
    pagination?: PaginationState | false;
    visibility?: ColumnVisibilityState | false;
    column_filters?: ColumnFiltersState | false;
  };
};
