<!-- svelte-ignore state_referenced_locally -->
<script
  lang="ts"
  generics="TData extends Record<string, unknown>"
>
  import type { TanstackTableInput } from "$lib/interfaces/tanstack/table.type";
  import { features, type Features } from "$lib/utils/tanstack/table.util";
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
    sorting: states.sorting !== false,
    column_filters: states.column_filters !== false,
    visibility: states.visibility !== false,
    grouping: !!states.grouping,
    expanding: !!states.expanded,
    selection: states.selection !== undefined,
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
   * The visibility the user had chosen before grouping took it over. Not
   * `$state`: nothing renders from it — written on the way into a grouping,
   * read once on the way out.
   */
  let visibility_before_grouping: ColumnVisibilityState | undefined;

  const table = createTable({
    features,
    columns,

    get data() {
      return data;
    },

    getRowId: get_row_id ?? ((original, index) => String(original.id ?? index)),

    enableSorting: enabled.sorting,
    enableColumnFilters: enabled.column_filters,
    enableHiding: enabled.visibility,
    enableGrouping: enabled.grouping,
    enableExpanding: enabled.expanding,
    enableRowSelection: enabled.selection,

    state: {
      get sorting() {
        return sorting();
      },
      get pagination() {
        return pagination();
      },
      get rowSelection() {
        return selection();
      },
      get columnFilters() {
        return column_filters();
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
    onColumnFiltersChange: set_column_filters,
    onPaginationChange: set_pagination,
    onRowSelectionChange: set_selection,
    onColumnVisibilityChange: set_visibility,
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

            const next: ColumnVisibilityState = { ...visibility() };
            for (const column of table.getAllColumns()) {
              if (grouping().includes(column.id)) continue;

              next[column.id] = column.columnDef.enableGrouping !== true;
            }
            set_visibility(next);
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
