<script lang="ts" generics="TData extends Item, TValue">
  import { createSvelteTable } from "$lib/components/ui/data-table/index.js";
  import type { TanstackTableInput } from "$lib/interfaces/tanstack/table.types";
  import type { Item } from "$lib/utils/items.util";
  import type { Table } from "@tanstack/table-core";
  import {
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
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
  }: TanstackTableInput<TData, TValue> & {
    children: Snippet<[Table<TData>]>;
  } = $props();

  let sorting = $state(
    states.sorting === false ? undefined : (states.sorting ?? []),
  );
  let selection = $state(
    states.selection === false ? undefined : (states.selection ?? {}),
  );
  let visibility = $state(
    states.visibility === false ? undefined : (states.visibility ?? {}),
  );

  let pagination = $state(
    states.pagination === false
      ? undefined
      : (states.pagination ?? { pageIndex: 0, pageSize: 10 }),
  );

  let column_filters = $state(
    states.column_filters === false ? undefined : (states.column_filters ?? []),
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

    onRowSelectionChange:
      states.selection === false
        ? undefined
        : (updater) => (selection = resolve_updater(updater, selection!)),

    onColumnVisibilityChange:
      states.visibility === false
        ? undefined
        : (updater) => (visibility = resolve_updater(updater, visibility!)),
  });
</script>

{@render children(table)}
