<script
  lang="ts"
  generics="TData extends Item"
>
  import { createSvelteTable } from "$lib/components/ui/data-table/index.js";
  import type { TanstackTableInput } from "$lib/interfaces/tanstack/table.types";
  import type { Item } from "$lib/utils/items.util";
  import type { Table } from "@tanstack/table-core";
  import {
    getCoreRowModel,
    getExpandedRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getGroupedRowModel,
    getPaginationRowModel,
    getSortedRowModel,
  } from "@tanstack/table-core";
  import type { Snippet } from "svelte";

  const resolve_updater = <T,>(updater: T | ((old: T) => T), old: T): T =>
    typeof updater === "function" ? (updater as (old: T) => T)(old) : updater;

  /** Rune-y wrapper around createSvelteTable
   * Let's us render different UI around the tanstack functionality
   * Not just a Shad datatable, but could be a grid of cards, for example
   */

  let {
    data,
    columns,
    faceting,
    states = {},
    children,
  }: TanstackTableInput<TData> & {
    children: Snippet<[Table<TData>]>;
  } = $props();

  // TODO(svelte5): Could possibly use a PersistedState on the whole table state
  // Use page.url.pathname as the key

  let sorting = $state(
    states.sorting === false ? undefined : (states.sorting ?? []),
  );
  let selection = $state(states.selection);

  let visibility = $state(
    states.visibility === false ? undefined : (states.visibility ?? {}),
  );

  let column_filters = $state(
    states.column_filters === false ? undefined : (states.column_filters ?? []),
  );

  let grouping = $state(!states.grouping ? undefined : states.grouping);
  let expanded = $state(!states.expanded ? undefined : states.expanded);

  let pagination = $state(
    states.pagination === false
      ? undefined
      : (states.pagination ?? {
          pageIndex: 0,
          pageSize: 20,
        }),
  );

  const table = createSvelteTable({
    columns,

    get data() {
      return data;
    },

    getRowId: (original) => original.id,

    getCoreRowModel: getCoreRowModel(),

    getSortedRowModel:
      states.sorting === false ? undefined : getSortedRowModel(),

    getPaginationRowModel:
      states.pagination === false ? undefined : getPaginationRowModel(),

    getFilteredRowModel:
      states.column_filters === false ? undefined : getFilteredRowModel(),

    getGroupedRowModel: !states.grouping ? undefined : getGroupedRowModel(),

    getExpandedRowModel: !states.expanded ? undefined : getExpandedRowModel(),

    getFacetedRowModel: faceting === true ? getFacetedRowModel() : undefined,

    getFacetedUniqueValues:
      faceting === true ? getFacetedUniqueValues() : undefined,

    state: {
      get sorting() {
        return sorting;
      },
      get pagination() {
        return pagination;
      },
      get rowSelection() {
        return selection;
      },
      get columnFilters() {
        return column_filters;
      },
      get columnVisibility() {
        return visibility;
      },

      get grouping() {
        return grouping;
      },

      get expanded() {
        return expanded;
      },
    },

    onSortingChange:
      states.sorting === false
        ? undefined
        : (updater) => (sorting = resolve_updater(updater, sorting!)),

    onColumnFiltersChange:
      states.column_filters === false
        ? undefined
        : (updater) =>
            (column_filters = resolve_updater(updater, column_filters!)),

    onPaginationChange:
      states.pagination === false
        ? undefined
        : (updater) => (pagination = resolve_updater(updater, pagination!)),

    onRowSelectionChange: states.selection
      ? (updater) => (selection = resolve_updater(updater, selection!))
      : undefined,

    onColumnVisibilityChange:
      states.visibility === false
        ? undefined
        : (updater) => (visibility = resolve_updater(updater, visibility!)),

    onGroupingChange: !states.grouping
      ? undefined
      : (updater) => {
          grouping = resolve_updater(updater, grouping!);

          // NOTE: A little jank...
          // When grouping by some column, we hide the other groupable columns
          // cause they usually don't have a meaningful aggregation
          if (grouping?.length) {
            table.getAllColumns().forEach((column) => {
              if (grouping?.includes(column.id)) return;

              column.toggleVisibility(column.columnDef.enableGrouping !== true);
            });
          } else {
            table.resetColumnVisibility();
          }
        },

    onExpandedChange: !states.expanded
      ? undefined
      : (updater) => (expanded = resolve_updater(updater, expanded!)),
  });
</script>

{@render children(table)}
