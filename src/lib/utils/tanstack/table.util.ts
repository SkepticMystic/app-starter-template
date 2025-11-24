import Time from "$lib/components/Time.svelte";
import { renderComponent } from "$lib/components/ui/data-table";
import { getLocalTimeZone } from "@internationalized/date";
import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  PaginationState,
  Row,
  RowData,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/table-core";
import type { DateRange } from "bits-ui";
import type { ComponentProps } from "svelte";
import type { Item } from "../items.util";

const get_column_label = <TData>(column: Column<TData>) =>
  column.columnDef.meta?.label ?? column.id;

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

export const CellHelpers = {
  time: (
    cell: { getValue: () => ComponentProps<typeof Time>["date"] },
    props?: Omit<ComponentProps<typeof Time>, "date">,
  ) => renderComponent(Time, { date: cell.getValue(), ...props }),

  label: <T extends string>(
    cell: { getValue: () => T },
    map: Record<T, { label: string }>,
  ) => map[cell.getValue()]?.label ?? cell.getValue(),
};

export const TanstackTable = {
  filter_fns,
  get_column_label,
};
