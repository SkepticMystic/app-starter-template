import Badge from "#lib/components/ui/badge/badge.svelte";
import type {
  BadgeStatus,
  BadgeVariant,
} from "#lib/components/ui/badge/index.js";
import StatusBadge from "#lib/components/ui/badge/StatusBadge.svelte";
import { renderComponent } from "#lib/components/ui/data-table/index.js";
import Time from "#lib/components/ui/elements/Time.svelte";
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
  globalFilteringFeature,
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
import { EMPTY, Format } from "../format.util";
import {
  cell_title,
  count_label,
  empty_colspan,
  grouped_visibility,
  header_label,
  offset_of_page,
  page_of_offset,
  row_id,
  rows_keyable_by_id,
} from "./table_layout.util";

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

  // Up to the next midnight: `end.toDate` is the *start* of the last day, which left it out.
  return (
    value >= filter.start.toDate(tz) &&
    value < filter.end.add({ days: 1 }).toDate(tz)
  );
};

/**
 * The widths a column may declare, coarse on purpose — five buckets rather than
 * free-form classes, so the tables stay in step and the exact pixel is not a
 * decision worth taking sixteen times over.
 */
export type ColumnWidth = "xs" | "sm" | "md" | "lg" | "xl";

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
  globalFilteringFeature,
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

    /**
     * How wide this column may get before its content is clipped. Opt-in, so
     * absent is exactly today's behaviour. A `max-width`, not a pixel `size`:
     * `columnSizingFeature` defaults every column to 150px.
     */
    width?: ColumnWidth;

    /**
     * Wrap inside {@link ColumnWidth} rather than clipping — for the value with
     * no sensible truncation point, a URL or an address, where the middle
     * matters as much as the start.
     */
    wrap?: boolean;
  }>(),
});

export type Features = typeof features;

/** `createColumnHelper` bound to {@link features}, so callers don't repeat them. */
export const column_helper = <TData extends RowData>() =>
  createColumnHelper<Features, TData>();

const get_column_label = <TData extends RowData>(
  column: Column<Features, TData>,
) => column.columnDef.meta?.label ?? column.id;

/**
 * Grouping stays opt-in per column. v9's `getCanGroup()` is true for every
 * accessor column once the table enables grouping, but most columns have no
 * meaningful aggregation, so the column has to say so itself.
 */
const can_group = <TData extends RowData>(column: Column<Features, TData>) =>
  column.columnDef.enableGrouping === true && column.getCanGroup();

/**
 * The cells most columns are, so a column says which and nothing else: `cell: CellHelpers.text`.
 * Every one renders a missing value as {@link EMPTY} — the one placeholder, where hand-written
 * cells drift between `"-"`, `""` and `EMPTY`.
 */
export const CellHelpers = {
  /** A string as is; {@link EMPTY} for a null or a blank. */
  text: (cell: { getValue: () => string | null | undefined }) =>
    cell.getValue() || EMPTY,

  /** Seconds as `1m 23s`. */
  duration: (cell: { getValue: () => number | null | undefined }) =>
    Format.duration_sec(cell.getValue()),

  number: (
    cell: { getValue: () => number | null | undefined },
    options?: Intl.NumberFormatOptions,
  ) => Format.number(cell.getValue(), options),

  /** {@link number}, as a badge only when there is one: a column of red zeros is wallpaper. */
  count: (cell: { getValue: () => number }, variant: BadgeVariant) => {
    const value = cell.getValue();

    return value > 0
      ? renderComponent(Badge, { content: Format.number(value), variant })
      : Format.number(value);
  },

  time: (
    cell: { getValue: () => ComponentProps<typeof Time>["date"] },
    props?: Omit<ComponentProps<typeof Time>, "date">,
  ) => renderComponent(Time, { date: cell.getValue(), ...props }),

  label: <T extends string>(
    cell: { getValue: () => T },
    map: Record<T, { label: string }>,
  ) => map[cell.getValue()]?.label ?? cell.getValue(),

  /**
   * {@link CellHelpers.label}, but rendered as the `StatusBadge` the map already
   * carries a colour (and maybe a cue) for. `EMPTY` for a null — a column whose value is optional renders
   * a dash rather than a badge for a state nobody chose.
   */
  badge: <T extends string>(
    cell: { getValue: () => T | null | undefined },
    map: Record<T, BadgeStatus>,
  ) => {
    const value = cell.getValue();
    if (!value) return EMPTY;

    const entry = map[value];
    if (!entry) return value;

    return renderComponent(StatusBadge, { status: entry });
  },
};

/** The slice of v9's `HeaderContext` that {@link DEFAULT_COLUMN} touches. */
type HeaderLabelContext = {
  column: {
    columnDef: Parameters<typeof header_label>[0];
    id: string;
  };
};

/**
 * The slice of v9's `CellContext` that {@link DEFAULT_COLUMN} touches — narrow
 * for the same reason as {@link HeaderLabelContext}.
 */
type RenderValueContext = { renderValue: () => unknown };

/**
 * The column def every column is merged onto, so `meta.label` reaches the
 * header. Must stay a module-level constant: `table_getDefaultColumnDef`
 * memoizes on it, so a literal here would bust that memo on every render.
 */
export const DEFAULT_COLUMN = {
  header: ({ column }: HeaderLabelContext) =>
    header_label(column.columnDef, column.id),

  /**
   * v9's own fallback cell, reproduced rather than inherited: `columnDef.cell`
   * is always a function, so owning it gives it an identity and
   * `cell === DEFAULT_COLUMN.cell` becomes an askable question — which is what
   * lets a clipped cell know whether its own text is the value.
   */
  cell: ({ renderValue }: RenderValueContext) => {
    const value = renderValue();

    // `String(…)` over v9's `?.toString?.()`, with the null/undefined case taken
    // first. `renderValue()` is `unknown`, which is what makes the guard
    // explicit rather than optional-chained.
    // oxlint-disable-next-line typescript/no-base-to-string
    return value === null || value === undefined ? null : String(value);
  },
};

export const TanstackTable = {
  can_group,
  cell_title,
  count_label,
  empty_colspan,
  get_column_label,
  grouped_visibility,
  offset_of_page,
  page_of_offset,
  row_id,
  rows_keyable_by_id,
};
