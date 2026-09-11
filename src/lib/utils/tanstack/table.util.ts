import { renderComponent } from "$lib/components/ui/data-table";
import Time from "$lib/components/ui/elements/Time.svelte";
import { getLocalTimeZone } from "@internationalized/date";
import {
  aggregationFn_count,
  aggregationFn_extent,
  aggregationFn_sum,
  aggregationFn_unique,
  aggregationFn_uniqueCount,
  columnFacetingFeature,
  columnFilteringFeature,
  columnGroupingFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createExpandedRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrHas,
  filterFn_arrIncludes,
  filterFn_arrIncludesSome,
  filterFn_equals,
  filterFn_inDateRange,
  filterFn_includesString,
  filterFn_inNumberRange,
  filterFn_weakEquals,
  metaHelper,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  type Column,
  type FilterFn,
  type RowData,
  type TableFeatures,
} from "@tanstack/svelte-table";
import type { DateRange } from "bits-ui";
import type { ComponentProps } from "svelte";
import { Format } from "../format.util";

/**
 * Keeps rows whose date falls inside an inclusive bits-ui calendar range. A
 * half-open range matches everything, so the filter is a no-op until both ends
 * are picked.
 */
const date_range: FilterFn<TableFeatures, RowData> = (
  row,
  column_id,
  filter: DateRange | undefined,
) => {
  if (!filter?.start || !filter.end) return true;

  const value = row.getValue<Date | null | undefined>(column_id);
  if (!value) return false;

  const tz = getLocalTimeZone();

  return value >= filter.start.toDate(tz) && value <= filter.end.toDate(tz);
};

/**
 * Every tanstack feature this DataTable UI can drive, registered once. v9 needs
 * them declared up front and the type flows into every `ColumnDef`, so tables
 * opt out through their `enable*` option rather than by leaving a feature out.
 */
export const features = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  columnGroupingFeature,
  columnVisibilityFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,

  expandedRowModel: createExpandedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filteredRowModel: createFilteredRowModel(),
  groupedRowModel: createGroupedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),

  /**
   * Columns default to `filterFn: "auto"`, which resolves a built-in **by name**
   * off this registry — and an unregistered name resolves to `undefined` and
   * silently stops filtering, with nothing on screen to say so. Note
   * `arrIncludesSome` is array-valued only; `arrHas` is the scalar-cell one,
   * which is what a status column wants.
   */
  filterFns: {
    arrHas: filterFn_arrHas,
    arrIncludes: filterFn_arrIncludes,
    arrIncludesSome: filterFn_arrIncludesSome,
    date_range,
    equals: filterFn_equals,
    inDateRange: filterFn_inDateRange,
    includesString: filterFn_includesString,
    inNumberRange: filterFn_inNumberRange,
    weakEquals: filterFn_weakEquals,
  },

  /**
   * The same trap, grouping-only: every column defaults to
   * `aggregationFn: "auto"`, resolved by name from here. Milder than the filter
   * case — v9 warns on an unregistered name rather than resolving to undefined.
   */
  aggregationFns: {
    count: aggregationFn_count,
    extent: aggregationFn_extent,
    sum: aggregationFn_sum,
    unique: aggregationFn_unique,
    uniqueCount: aggregationFn_uniqueCount,
  },

  /**
   * Columns default to `sortFn: "auto"`, resolved by name from here. Leaving one
   * out degrades silently to `sortFn_basic`, so "item 10" sorts before "item 9".
   */
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },

  /**
   * Replaces the `declare module "@tanstack/table-core"` augmentation that used
   * to carry this — v9 threads column meta through the feature registry.
   */
  columnMeta: metaHelper<{
    /**
     * The short name this column goes by, and the only name the visibility menu
     * can show, since that renders strings. A header with interactive content
     * needs one regardless: its trigger is a `<button>`.
     */
    label?: string;
  }>(),
});

export type Features = typeof features;

/** `createColumnHelper` bound to {@link features}, so callers don't repeat them. */
export const column_helper = <TData extends RowData>() =>
  createColumnHelper<Features, TData>();

const get_column_label = <TData extends RowData>(
  column: Column<Features, TData>,
) => column.columnDef.meta?.label ?? column.id;

export const CellHelpers = {
  number: (
    cell: { getValue: () => number },
    options?: Intl.NumberFormatOptions,
  ) => Format.number(cell.getValue(), options),

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
  get_column_label,
};
