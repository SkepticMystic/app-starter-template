import type { DropdownMenuItemInput } from "$lib/components/ui/dropdown-menu/dropdown-menu.types";
import type { SelectOption } from "$lib/interfaces";
import type { Features } from "$lib/utils/tanstack/table.util";
import type { SearchParamValue } from "$lib/utils/urls";
import type { DateRange } from "bits-ui";
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
import type { Snippet } from "svelte";

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
  // oxlint-disable-next-line typescript/no-explicit-any
  columns: ColumnDef<Features, TData, any>[];
  /**
   * Absent means this table owns its own filtering, sorting and paging over the
   * array in `data`. Present means the server already did — see
   * {@link TanstackTableServer}.
   */
  server?: TanstackTableServer;
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
    /**
     * Search across the columns that opt in with `enableGlobalFilter: true`. Off
     * unless present — `""` turns it on with an empty box, the same way
     * `selection: {}` turns row selection on.
     */
    global_filter?: string | false;
  };
};

/**
 * The value a filter control hands back on its way to `setFilterValue`.
 * `undefined` is the "unset" signal and is load-bearing: v9's `autoRemove` drops
 * it, where `""` would sit there matching every row.
 */
export type DataTableFilterValue =
  | string
  | number
  | boolean
  | string[]
  | DateRange
  | undefined;

type DataTableFilterBase = {
  /**
   * The column this control narrows. A column id rather than a free-form name,
   * so one descriptor serves both backends: the client calls `getColumn(id)`,
   * and a server table sends the same id as its param.
   */
  id: string;

  /**
   * The name shown above the control. Absent renders it bare, present wraps it
   * in a `Field` — a labelled row of filters versus one bare box is a real
   * choice rather than an inconsistency to flatten.
   */
  label?: string;

  /**
   * The query param this rides in, when the table is server-driven. Defaults to
   * the column id, which is not always right: a filter whose column holds an
   * array of tags sends `?tag=` per id while the column itself is `tags`.
   */
  param?: string;
};

/**
 * One filter control, declared once and rendered by `data-table-toolbar.svelte`.
 * Replaces two dialects: the hand-written `getFilterValue`/`setFilterValue`
 * pair, and the hand-written URL writer.
 */
export type DataTableFilter =
  | (DataTableFilterBase & {
      kind: "search";
      placeholder?: string;

      /**
       * How long to wait after the last keystroke before writing. Zero suits a
       * client table filtering an array already in memory; a server table sets
       * this, where a character is a round trip.
       */
      debounce_ms?: number;
    })
  | (DataTableFilterBase & {
      kind: "select";

      /**
       * One value or none — a partition. Not narrowed to strings because `false`
       * is a real choice on the admin users Banned filter: "the users who are
       * *not* banned" has to stay expressible.
       */
      options: SelectOption<string | number | boolean>[];

      /** The label on the "no filter" option this prepends. */
      all_label?: string;
    })
  | (DataTableFilterBase & {
      kind: "multi";

      /**
       * Several values at once; the column wants `filterFn: "arrHas"` if its
       * cell holds a single value. **Omit to derive from the column** — but a
       * server table must declare them, since faceting sees one page.
       */
      options?: SelectOption<string>[];

      placeholder?: string;
    })
  | (DataTableFilterBase & {
      kind: "date_range";

      /** What the trigger says before a range is picked. */
      placeholder?: string;

      /** Refuse a range longer than this, in the calendar rather than on submit. */
      max_days?: number;

      /**
       * NOTE: client-side only today. A URL cannot hold one param that is a pair
       * of dates; a server version needs a `_from`/`_to` encoding and a loader,
       * so `read_param` reports one as unset.
       */
    })
  | (DataTableFilterBase & {
      kind: "custom";

      /**
       * Whether this control holds several values at once — the one thing the
       * toolbar cannot infer from a snippet. Decides how the value is read back
       * out of the URL, so it does nothing on a client table.
       */
      multiple?: boolean;

      /**
       * The page's own control, given the current value and a way to set it. The
       * escape hatch, for a control that knows things `ui/` should not have to.
       */
      control: Snippet<
        [
          {
            value: unknown;
            set: (value: DataTableFilterValue) => void;
            /**
             * What `Field` hands its input — `id` and `aria-invalid`. Forwarded
             * so a `custom` filter declaring a label can put the `id` on
             * whichever element it labels. Ignorable.
             */
            props: Record<string, unknown>;
          },
        ]
      >;
    });

/**
 * Where the rows come from, when they do not come from the array in `data`.
 * Present means the server already filtered, sorted and paged, so v9 passes its
 * row models through and gets the true `rowCount`.
 */
export type TanstackTableServer = {
  /** Rows matching the current filters, across every page — not `data.length`. */
  total: number;

  /** The current page, as the URL holds it. */
  offset: number;
  limit: number;

  /**
   * The query string as it stands, which is where the filter controls read their
   * values from. The URL is the source of truth on these pages, so a copied link
   * and the back button both restore the view.
   */
  params: URLSearchParams;

  /**
   * Apply a patch to that query string. A prop rather than an import because
   * `ui/` components in this repo do not reach for `$app/navigation`.
   */
  on_change: (patch: Record<string, SearchParamValue>) => void;
};
