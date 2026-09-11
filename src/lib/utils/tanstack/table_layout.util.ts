import { Format } from "../format.util";
import { Strings } from "../strings.util";
import type {
  ColumnVisibilityState,
  PaginationState,
} from "@tanstack/svelte-table";

/** The layout rules the DataTable's markup used to carry inline. Kept out of `table.util.ts`,
 * which pulls in `Time.svelte` — and the vitest project runs `node`, with no component runner. */

/** The header a column falls back to when it declares none of its own. v9's built-in default is a
 * *function*, not `undefined`, so `columnDef.header` cannot answer "did the caller supply one?". */
export const header_label = (
  column_def: {
    meta?: { label?: string };
    accessorKey?: unknown;
    accessorFn?: unknown;
  },
  column_id: string,
): string | null => {
  if (column_def.meta?.label !== undefined) return column_def.meta.label;

  // `typeof`-narrowed rather than wrapped in `String()`: the param is `unknown` so this stays
  // assignable to v9's `HeaderContext`, and `String()` over one is how a header reads "[object Object]".
  if (typeof column_def.accessorKey === "string") return column_def.accessorKey;
  if (typeof column_def.accessorKey === "number")
    return String(column_def.accessorKey);

  if (column_def.accessorFn !== undefined) return column_id;

  return null;
};

/** The "12 contacts" line six page headers wrote by hand. The count is `getRowCount()` at the
 * call site; a tuple for the irregular plural, because `pluralize("delivery", n)` gives "deliverys". */
export const count_label = (count: number, noun: string | [string, string]) => {
  const [one, many] = Array.isArray(noun) ? noun : [noun, `${noun}s`];

  return `${Format.number(count)} ${Strings.pluralize(one, count, many)}`;
};

/** Whether every row carries a string `id`, so ids can key the whole table. Asked once per data
 * set, not per row — mixing namespaces collides an id-less row's `"3"` with a real id `"3"`. */
export const rows_keyable_by_id = (
  data: readonly Record<string, unknown>[],
): boolean => data.every((row) => typeof row.id === "string");

/** The key a row is tracked by when the caller names no `get_row_id`. The index rather than
 * `String(original.id)` when id-less: `String(undefined)` is the same key for every such row. */
export const row_id = (
  original: Record<string, unknown>,
  index: number,
  keyable_by_id: boolean,
): string => (keyable_by_id ? (original.id as string) : String(index));

/** How far an empty-state row has to stretch. Visible *leaf* columns, not `options.columns.length`,
 * which counts a grouped header once and a hidden column anyway — on the screen nobody re-checks. */
export const empty_colspan = (input: {
  visible_leaf_columns: number;
  selection: boolean;
  actions: boolean;
}): number =>
  input.visible_leaf_columns +
  (input.selection ? 1 : 0) +
  (input.actions ? 1 : 0);

/** `?offset=` / `?limit=` — the vocabulary of every list query and of `Paginator` — as the
 * zero-based page tanstack keeps in state. The pair exists so one pager can be driven by either. */
export const page_of_offset = (
  offset: number,
  limit: number,
): PaginationState => ({
  // A zero or negative limit would divide by nothing and yield Infinity or NaN.
  pageIndex: limit > 0 ? Math.floor(offset / limit) : 0,
  pageSize: limit,
});

/** The `?offset=` a page index stands for. Guarded against a non-finite page size: `pagination:
 * false` is `pageSize: Infinity`, and `0 * Infinity` is `NaN`, which reaches the pager as "NaN / 1". */
export const offset_of_page = (pagination: PaginationState): number =>
  Number.isFinite(pagination.pageSize)
    ? pagination.pageIndex * pagination.pageSize
    : 0;

/** The `title` a clipped cell needs. Primitives only, and only from a cell that renders its value
 * as its own text — a formatted or `renderComponent` cell would promise something else. */
export const cell_title = (
  value: unknown,
  renders_value: boolean,
): string | undefined =>
  renders_value && (typeof value === "string" || typeof value === "number")
    ? String(value)
    : undefined;

/** The column visibility to show while grouped: the other groupable columns hidden, the one
 * being grouped by un-hidden. Merged onto `current`, so grouping is a view rather than an edit. */
export const grouped_visibility = (
  columns: { id: string; groupable: boolean }[],
  grouping: string[],
  current: ColumnVisibilityState,
): ColumnVisibilityState => {
  // No grouping means no opinion — hand back what the user chose, untouched.
  if (!grouping.length) return current;

  const next: ColumnVisibilityState = { ...current };

  for (const column of columns) {
    if (!column.groupable) continue;

    next[column.id] = grouping.includes(column.id);
  }

  return next;
};
