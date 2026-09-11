<!-- svelte-ignore state_referenced_locally -->
<script
  lang="ts"
  generics="TData extends Record<string, unknown>"
>
  import type { TanstackTableInput } from "$lib/interfaces/tanstack/table.type";
  import {
    DEFAULT_COLUMN,
    features,
    TanstackTable as TanstackTableUtil,
    type Features,
  } from "$lib/utils/tanstack/table.util";
  import { TableFilters } from "$lib/utils/tanstack/table_filter.util";
  import {
    createTable,
    createTableState,
    type ColumnVisibilityState,
    type Table,
  } from "@tanstack/svelte-table";
  import type { Snippet } from "svelte";

  /** Rune-y wrapper around tanstack's `createTable`
   * Let's us render different UI around the tanstack functionality
   * Not just a Shad datatable, but could be a grid of cards, for example
   */

  let {
    data,
    columns,
    states = {},
    server,
    get_row_id,
    children,
  }: TanstackTableInput<TData> & {
    children: Snippet<[Table<Features, TData>]>;
  } = $props();

  // TODO(svelte5): Could possibly use a PersistedState on the whole table state
  // Use page.url.pathname as the key

  /**
   * v9 registers features once, statically, so a table opts out through its
   * `enable*` option rather than by dropping a row model — which is also what
   * makes `getCanSort()` / `getCanHide()` report the truth. Under v8 those
   * answered yes for columns whose feature had been switched off by omission.
   */
  const enabled = {
    /**
     * Both off in server mode: sorting one page of a 50,000-row list presents a
     * lie as an ordering, and a client filter over the 50 rows the server
     * already chose is the most misleading thing such a page could do.
     */
    sorting: !server && states.sorting !== false,
    column_filters: !server && states.column_filters !== false,
    visibility: states.visibility !== false,
    grouping: !!states.grouping,
    expanding: !!states.expanded,
    selection: states.selection !== undefined,
    /** Off unless asked for, like `selection`, and `!server` for the reason above. */
    global_filter:
      !server &&
      states.global_filter !== undefined &&
      states.global_filter !== false,
  };

  const [sorting, set_sorting] = createTableState(states.sorting || []);
  const [selection, set_selection] = createTableState(states.selection ?? {});
  const [visibility, set_visibility] = createTableState(
    states.visibility || {},
  );
  const [grouping, set_grouping] = createTableState(states.grouping || []);
  const [expanded, set_expanded] = createTableState(states.expanded || {});
  const [column_filters, set_column_filters] = createTableState(
    states.column_filters || [],
  );
  const [global_filter, set_global_filter] = createTableState(
    states.global_filter || "",
  );

  /**
   * The offset the current selection was made on, so a page turn can clear it.
   * `bulk_actions` reads `getFilteredSelectedRowModel()`, which holds one page,
   * so a selection surviving a page turn sends the wrong set.
   */
  let selected_at_offset = server?.offset;

  $effect(() => {
    if (!server || server.offset === selected_at_offset) return;

    selected_at_offset = server.offset;
    set_selection({});
  });

  /**
   * `pageSize: Infinity` is v9's "one page of everything": the paginated row
   * model passes rows straight through and `getPageCount()` stays at 1, which
   * is what hides the pager.
   */
  const [pagination, set_pagination] = createTableState(
    states.pagination === false
      ? { pageIndex: 0, pageSize: Infinity }
      : (states.pagination ?? { pageIndex: 0, pageSize: 20 }),
  );

  /**
   * Memoised, and load-bearing: v9 syncs controlled state by **reference**, and
   * the adapter re-reads every getter on each options sync — a fresh object each
   * time busts `getPageCount()` on every tick.
   */
  const server_pagination = $derived(
    server
      ? TanstackTableUtil.page_of_offset(server.offset, server.limit)
      : undefined,
  );

  /**
   * Whether this data set's own `id`s can key the table. Derived once rather than
   * computed per row, because the answer has to be the same for every row in the
   * set or the keys collide.
   */
  const keyable_by_id = $derived(TanstackTableUtil.rows_keyable_by_id(data));

  /**
   * What a Clear resets to — the view the page seeded, not an empty one. v9
   * restores `initialState`, so a table seeding `status: ["pending"]` that omits
   * this has that view destroyed by Clear.
   */
  const seeded = TableFilters.seeded(states);

  /**
   * The visibility the user had chosen before grouping took it over. Not
   * `$state`: nothing renders from it — written on the way into a grouping,
   * read once on the way out.
   */
  let visibility_before_grouping: ColumnVisibilityState | undefined;

  const table = createTable({
    features,
    columns,

    defaultColumn: DEFAULT_COLUMN,

    initialState: {
      columnFilters: seeded.column_filters,
      globalFilter: seeded.global_filter,
    },

    /**
     * The three flags that make one component serve a 20-row settings table and
     * one page of a 50,000-row list. `rowCount` is a **getter**: read flat it
     * pins to first render and the pager goes stale.
     */
    manualFiltering: !!server,
    manualSorting: !!server,
    manualPagination: !!server,

    get rowCount() {
      return server?.total;
    },

    get data() {
      return data;
    },

    /**
     * What row selection is keyed on, and what the body's keyed `{#each}` tracks
     * rows by — so whatever it returns must be unique. The previous
     * `String(original.id ?? index)` mixed two key namespaces, so an id-less row
     * at index 3 collided with a real row whose id is `"3"`.
     */
    getRowId: (original, index) =>
      get_row_id?.(original, index) ??
      TanstackTableUtil.row_id(original, index, keyable_by_id),

    enableSorting: enabled.sorting,
    enableColumnFilters: enabled.column_filters,
    enableHiding: enabled.visibility,
    enableGrouping: enabled.grouping,
    enableExpanding: enabled.expanding,
    enableRowSelection: enabled.selection,
    enableGlobalFilter: enabled.global_filter,

    /**
     * Global search is opt-in per column, not "every column holding text". v9's
     * default scans every row of every column, so a typed number matches an
     * opaque id nobody was looking for.
     */
    getColumnCanGlobalFilter: (column) =>
      // `in` first, because this callback is generic over every `TableFeatures`
      // and so cannot see the global-filtering column-def extension. v9's own
      // default narrows the same way.
      "enableGlobalFilter" in column.columnDef &&
      column.columnDef.enableGlobalFilter === true,

    state: {
      get sorting() {
        return sorting();
      },
      get pagination() {
        /**
         * Derived from the props in server mode rather than held locally: the
         * URL is the source of truth there, so the table follows it instead of
         * keeping a second copy that could disagree.
         */
        return server_pagination ?? pagination();
      },
      get rowSelection() {
        return selection();
      },
      get columnFilters() {
        return column_filters();
      },
      get globalFilter() {
        return global_filter();
      },
      get columnVisibility() {
        return visibility();
      },
      get grouping() {
        return grouping();
      },
      get expanded() {
        return expanded();
      },
    },

    onSortingChange: set_sorting,
    onPaginationChange: set_pagination,
    onRowSelectionChange: set_selection,
    onColumnFiltersChange: set_column_filters,
    onColumnVisibilityChange: set_visibility,
    onGlobalFilterChange: set_global_filter,
    onExpandedChange: set_expanded,

    onGroupingChange: !enabled.grouping
      ? undefined
      : (updater) => {
          const was_grouped = grouping().length > 0;
          set_grouping(updater);
          const is_grouped = grouping().length > 0;

          // When grouping by some column, we hide the other groupable columns
          // cause they usually don't have a meaningful aggregation.
          if (is_grouped) {
            // Snapshot on the way in only, so re-grouping does not overwrite
            // the user's own choices with a grouped view.
            if (!was_grouped) visibility_before_grouping = { ...visibility() };

            /**
             * Only the *groupable* columns are touched. The previous loop also
             * wrote `true` for every non-groupable column, which un-hid columns
             * the user had hidden themselves.
             */
            set_visibility(
              TanstackTableUtil.grouped_visibility(
                table.getAllColumns().map((column) => ({
                  id: column.id,
                  groupable: column.columnDef.enableGrouping === true,
                })),
                grouping(),
                visibility(),
              ),
            );
          } else {
            /**
             * Restore rather than reset. `resetColumnVisibility()` discarded
             * every column the user had hidden themselves, so ungrouping
             * silently undid their own choices along with the grouping's.
             */
            set_visibility(visibility_before_grouping ?? {});
            visibility_before_grouping = undefined;
          }
        },
  });
</script>

{@render children(table)}
