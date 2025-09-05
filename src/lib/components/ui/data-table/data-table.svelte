<script lang="ts" generics="TData, TValue">
  import Button from "$lib/components/ui/button/button.svelte";
  import {
    createSvelteTable,
    FlexRender,
  } from "$lib/components/ui/data-table/index.js";
  import * as ShadTable from "$lib/components/ui/table/index.js";
  import { Format } from "$lib/utils/format.util";
  import {
    type ColumnDef,
    type ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type PaginationState,
    type RowSelectionState,
    type SortingState,
    type Table,
    type VisibilityState,
  } from "@tanstack/table-core";
  import type { Snippet } from "svelte";
  import DataTableVisibilityDropdownMenu from "./data-table-visibility-dropdown-menu.svelte";

  let {
    data,
    states,
    columns,
    filters,
  }: {
    data: TData[];
    columns: ColumnDef<TData, TValue>[];

    // snippets
    filters?: Snippet<[table: Table<TData>]>;

    // state
    states: {
      sorting?: SortingState | false;
      pagination?: PaginationState | false;
      visibility?: VisibilityState | false;
      selection?: RowSelectionState | false;
      column_filters?: ColumnFiltersState | false;
    };
  } = $props();

  let sorting = $state(
    states.sorting === false ? undefined : (states.sorting ?? []),
  );
  let visibility = $state(
    states.visibility === false ? undefined : (states.visibility ?? {}),
  );
  let selection = $state(
    states.selection === false ? undefined : (states.selection ?? {}),
  );
  let column_filters = $state(
    states.column_filters === false ? undefined : (states.column_filters ?? []),
  );
  let pagination = $state(
    states.pagination === false
      ? undefined
      : (states.pagination ?? { pageIndex: 0, pageSize: 10 }),
  );

  const table = createSvelteTable({
    columns,

    get data() {
      return data;
    },

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel:
      states.sorting === false ? undefined : getSortedRowModel(),
    getFilteredRowModel:
      states.column_filters === false ? undefined : getFilteredRowModel(),
    getPaginationRowModel:
      states.pagination === false ? undefined : getPaginationRowModel(),

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
        : (updater) =>
            (sorting =
              typeof updater === "function" ? updater(sorting!) : updater),

    onColumnFiltersChange:
      states.column_filters === false
        ? undefined
        : (updater) =>
            (column_filters =
              typeof updater === "function"
                ? updater(column_filters!)
                : updater),

    onPaginationChange:
      states.pagination === false
        ? undefined
        : (updater) =>
            (pagination =
              typeof updater === "function" ? updater(pagination!) : updater),

    onRowSelectionChange:
      states.selection === false
        ? undefined
        : (updater) =>
            (selection =
              typeof updater === "function" ? updater(selection!) : updater),

    onColumnVisibilityChange:
      states.visibility === false
        ? undefined
        : (updater) =>
            (visibility =
              typeof updater === "function" ? updater(visibility!) : updater),
  });
</script>

<div class="space-y-3">
  <div class="flex items-end justify-between">
    {#if column_filters}
      {@render filters?.(table)}
    {:else}
      <div></div>
    {/if}

    <DataTableVisibilityDropdownMenu {table} />
  </div>

  <div>
    <ShadTable.Root>
      <ShadTable.Header>
        {#each table.getHeaderGroups() as header_group (header_group.id)}
          <ShadTable.Row>
            {#each header_group.headers as header (header.id)}
              <ShadTable.Head colspan={header.colSpan}>
                {#if !header.isPlaceholder}
                  <FlexRender
                    content={header.column.columnDef.header}
                    context={header.getContext()}
                  />
                {/if}
              </ShadTable.Head>
            {/each}
          </ShadTable.Row>
        {/each}
      </ShadTable.Header>

      <ShadTable.Body>
        {#each table.getRowModel().rows as row (row.id)}
          <ShadTable.Row data-state={row.getIsSelected() && "selected"}>
            {#each row.getVisibleCells() as cell (cell.id)}
              <ShadTable.Cell>
                <FlexRender
                  content={cell.column.columnDef.cell}
                  context={cell.getContext()}
                />
              </ShadTable.Cell>
            {/each}
          </ShadTable.Row>
        {:else}
          <ShadTable.Row>
            <ShadTable.Cell colspan={columns.length} class="h-24 text-center">
              No results.
            </ShadTable.Cell>
          </ShadTable.Row>
        {/each}
      </ShadTable.Body>
    </ShadTable.Root>
  </div>

  <div class="flex items-center justify-between">
    <div class="text-sm text-muted-foreground">
      {Format.number(table.getFilteredSelectedRowModel().rows.length)} of
      {Format.number(table.getFilteredRowModel().rows.length)} rows selected
    </div>

    <div class="flex items-center justify-end space-x-2">
      <Button
        variant="outline"
        size="sm"
        disabled={!table.getCanPreviousPage()}
        onclick={() => table.previousPage()}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!table.getCanNextPage()}
        onclick={() => table.nextPage()}
      >
        Next
      </Button>
    </div>
  </div>
</div>
