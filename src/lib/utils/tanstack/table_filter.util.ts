import type { SelectOption } from "$lib/interfaces";
import type {
  DataTableFilter,
  DataTableFilterValue,
} from "$lib/interfaces/tanstack/table.type";
import { DateRanges } from "../date/date_range.util";
import type { SearchParamValue } from "../urls";
import type { DateRange } from "bits-ui";
import type { ColumnFiltersState } from "@tanstack/svelte-table";

/** The pure half of the filter toolbar, kept out of the component so it can be tested. Not in
 * `table.util.ts`: that pulls in `Time.svelte`, and the test project is `environment: "node"`. */

/** Whether a control is holding nothing: `undefined` (a `select` on "All"), `""`, `[]`, or a seeded
 * `null`. `0` and `false` are real choices — `/admin/users`' Banned filter — so never truthiness. */
const is_empty_value = (value: unknown) => {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;

  // A half-open calendar range is the fifth empty shape: the `date_range` filterFn passes every row
  // until both ends are picked, and a Clear button lit over an unfiltered table is a lie.
  if (is_range(value)) return !DateRanges.is_complete(value);

  return false;
};

/** Whether this is a bits-ui `DateRange` rather than some other object. Both keys, not either: the
 * type declares `start` and `end` as present-and-possibly-undefined, so one alone is not one of these. */
const is_range = (value: unknown): value is DateRange =>
  typeof value === "object" &&
  value !== null &&
  "start" in value &&
  "end" in value;

/** The filter state a page seeded, normalised — what Clear restores, and what "is anything narrowing
 * this table?" is measured against. `|| []`, since `false` means "no client filtering" rather than "none set". */
const seeded = (states?: {
  column_filters?: ColumnFiltersState | false;
  global_filter?: string | false;
}) => ({
  column_filters: states?.column_filters || [],
  global_filter:
    typeof states?.global_filter === "string" ? states.global_filter : "",
});

/** One set of column filters as a string that compares equal iff they narrow the same way.
 * Order-insensitive: `setFilterValue` appends, so order records which control was touched first. */
const filter_key = (filters: ColumnFiltersState) =>
  filters
    .filter((filter) => !is_empty_value(filter.value))
    .map((filter) => `${filter.id}=${JSON.stringify(filter.value)}`)
    .toSorted()
    .join("&");

/** Whether these column filters differ from the ones the page seeded — what lights Clear on a client
 * table. Against the seed, not against empty: a table opening on `status: ["pending"]` is not filtered. */
const is_filtering_columns = (
  current: ColumnFiltersState,
  seed: ColumnFiltersState,
) => filter_key(current) !== filter_key(seed);

/** Whether the query string holds a value for any param these controls own — what lights Clear on a
 * server table. Asked of the URL, not of parsed values: `?key_id=` for a deleted key still narrows. */
const is_filtering_params = (
  filters: DataTableFilter[],
  params: URLSearchParams,
) =>
  filters.some((filter) =>
    params.getAll(param_of(filter)).some((value) => value !== ""),
  );

/** A column's filter value as a search box can render it. `getFilterValue()` is `unknown`, and a
 * number is a legitimate thing to find in there, so it is rendered rather than dropped. */
const text_value = (value: unknown) =>
  typeof value === "string"
    ? value
    : typeof value === "number"
      ? String(value)
      : "";

/** A column's filter value as a `MultiSelect` can render it. A checked narrowing rather than the
 * `as string[]` cast: a bare string would be `.includes`d and tick "pending" for containing "end". */
const multi_value = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];

/** A column's filter value as a `select` can render it. Anything outside `string | number | boolean`
 * reads as no choice made, rather than a value `NativeSelect` renders blank while still filtering. */
const select_value = (value: unknown): string | number | boolean | undefined =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean"
    ? value
    : undefined;

/** A column's filter value as a range picker can render it. Shape-checked rather than typed — a
 * `CalendarDate` is a class instance — leaving the calendar to reject anything malformed. */
const range_value = (value: unknown): DateRange | undefined =>
  is_range(value) ? value : undefined;

/** A `select`'s options with its "everything" choice in front. `undefined` for that choice, not
 * `""`: `NativeSelect` maps empty to `undefined`, and v9's `autoRemove` then drops the filter. */
const select_options = <V>(
  options: SelectOption<V>[],
  all_label = "All",
): SelectOption<V | undefined>[] => [
  { value: undefined, label: all_label },
  ...options,
];

/** A `multi` control's options, from `getFacetedUniqueValues()` — exactly the values present, with
 * real counts. Sorted by label, not count; non-strings dropped, since `MultiSelect` is `V extends string`. */
const facet_options = (
  values: Map<unknown, number> | undefined,
): SelectOption<string>[] =>
  [...(values?.entries() ?? [])]
    .filter(([value]) => typeof value === "string")
    .map(([value, count]) => ({
      value: value as string,
      label: `${value as string} (${count})`,
    }))
    .toSorted((a, b) => a.label.localeCompare(b.label));

/** The query param a descriptor rides in. */
const param_of = (filter: DataTableFilter) => filter.param ?? filter.id;

/** Read one control's current value back out of the query string. The other half of
 * {@link write_param}, and they must agree: a `multi` writes one param per value, so it `getAll`s. */
const read_param = (
  filter: DataTableFilter,
  params: URLSearchParams,
): DataTableFilterValue => {
  const key = param_of(filter);

  if (
    filter.kind === "multi" ||
    (filter.kind === "custom" && filter.multiple)
  ) {
    return params.getAll(key);
  }

  // See the `date_range` variant's NOTE: a pair of dates has no single-param encoding, and inventing
  // one without a loader that reads it would be a filter that appears to work and narrows nothing.
  if (filter.kind === "date_range") return undefined;

  const raw = params.get(key);
  if (raw === null) return undefined;

  /** A URL holds strings, and only the options know the real type — `?banned=true` is the
   * boolean. An unrecognised value reads as no choice made; Clear stays lit from the URL anyway. */
  if (filter.kind === "select") {
    return filter.options.find((option) => String(option.value) === raw)?.value;
  }

  return raw;
};

/** Every control's current value, keyed by `filter.id` — the server-side twin of
 * reading them off `table.getColumn(id)`. */
const read_params = (
  filters: DataTableFilter[],
  params: URLSearchParams,
): Record<string, DataTableFilterValue> =>
  Object.fromEntries(
    filters.map((filter) => [filter.id, read_param(filter, params)]),
  );

/** The patch that applies one filter change to the query string. `offset: null` rides along with
 * every one: page 7 of a result set that now has two renders empty and reads as broken. */
const write_param = (
  filter: DataTableFilter,
  value: DataTableFilterValue,
): Record<string, SearchParamValue> => ({
  /** A pair of dates has no single-param encoding — see the `date_range` NOTE — so on a server
   * table the control stays inert in *both* directions rather than writing a range no loader reads. */
  [param_of(filter)]: is_empty_value(value) || is_range(value) ? null : value,
  offset: null,
});

/** The patch that empties every control at once — what Clear sends. Every param this toolbar
 * owns and no others: a Clear that rebuilt the query string would take `limit` with it. */
const clear_params = (
  filters: DataTableFilter[],
): Record<string, SearchParamValue> => ({
  ...Object.fromEntries(filters.map((filter) => [param_of(filter), null])),
  offset: null,
});

export const TableFilters = {
  clear_params,
  facet_options,
  is_empty_value,
  is_filtering_columns,
  is_filtering_params,
  multi_value,
  range_value,
  read_param,
  read_params,
  seeded,
  select_options,
  select_value,
  text_value,
  write_param,
};
