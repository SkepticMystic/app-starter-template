<script lang="ts" generics="TData, TValue">
  import Button from "$lib/components/ui/button/button.svelte";
  import {
    createSvelteTable,
    FlexRender,
  } from "$lib/components/ui/data-table/index.js";
  import Input from "$lib/components/ui/input/input.svelte";
  import * as Table from "$lib/components/ui/table/index.js";
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
    type VisibilityState,
  } from "@tanstack/table-core";
  import DataTableVisibilityDropdownMenu from "./data-table-visibility-dropdown-menu.svelte";

  let {
    data,
    columns,
    ...states
  }: {
    data: TData[];
    columns: ColumnDef<TData, TValue>[];

    // states
    sorting?: SortingState | false;
    filters?: ColumnFiltersState | false;
    visibility?: VisibilityState | false;
    selection?: RowSelectionState | false;
    pagination?: PaginationState | false;
  } = $props();

  let sorting = $state(
    states.sorting === false ? undefined : (states.sorting ?? []),
  );
  let filters = $state(
    states.filters === false ? undefined : (states.filters ?? []),
  );
  let visibility = $state(
    states.visibility === false ? undefined : (states.visibility ?? {}),
  );
  let selection = $state(
    states.selection === false ? undefined : (states.selection ?? {}),
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
      states.filters === false ? undefined : getFilteredRowModel(),
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
        return filters;
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
      states.filters === false
        ? undefined
        : (updater) =>
            (filters =
              typeof updater === "function" ? updater(filters!) : updater),

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
  <div class="flex justify-between">
    <!-- TODO filters snippet -->
    <div>
      <Input
        class="max-w-sm"
        placeholder="Filter tasks..."
        value={table.getColumn("title")?.getFilterValue() ?? ""}
        oninput={(e) =>
          table.getColumn("title")?.setFilterValue(e.currentTarget.value)}
      />
    </div>

    <DataTableVisibilityDropdownMenu {table} />
  </div>

  <div>
    <Table.Root>
      <Table.Header>
        {#each table.getHeaderGroups() as header_group (header_group.id)}
          <Table.Row>
            {#each header_group.headers as header (header.id)}
              <Table.Head colspan={header.colSpan}>
                {#if !header.isPlaceholder}
                  <FlexRender
                    content={header.column.columnDef.header}
                    context={header.getContext()}
                  />
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>

      <Table.Body>
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row data-state={row.getIsSelected() && "selected"}>
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell>
                <FlexRender
                  content={cell.column.columnDef.cell}
                  context={cell.getContext()}
                />
              </Table.Cell>
            {/each}
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={columns.length} class="h-24 text-center">
              No results.
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
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
