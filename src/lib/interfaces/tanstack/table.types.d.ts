import type { Item } from "$lib/utils/items.util";
import "@tanstack/table-core";
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/table-core";

declare module "@tanstack/table-core" {
  interface ColumnMeta<_TData extends RowData, _TValue> {
    /** NOTE: Use when passing a snippet/component to `header`
     * (In this case, column.columnDef.header is a big html mess)
     */
    label?: string;
  }
}

export type TanstackTableInput<TData extends Item, TValue> = {
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
