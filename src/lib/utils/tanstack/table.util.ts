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
import type { Item } from "../items.util";

const get_column_label = <TData>(column: Column<TData>) =>
  column.columnDef.meta?.label ?? column.id;

const make_columns = <TData extends Item>(
  cb: (
    // NOTE: Specifically _don't_ wrap the helper
    // If we want to add more fields to utils, just `& { fields: ... }` them
    utils: ColumnHelper<TData>,
  ) => ColumnDef<TData>[],
) => {
  const col_helper = createColumnHelper<TData>();

  return cb(col_helper);
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
