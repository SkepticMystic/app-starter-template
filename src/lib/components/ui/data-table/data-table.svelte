<script
  lang="ts"
  generics="TData extends Item,TValue"
>
  import Button from "$lib/components/ui/button/button.svelte";
  import { FlexRender } from "$lib/components/ui/data-table/index.js";
  import * as ShadTable from "$lib/components/ui/table/index.js";
  import type { TanstackTableInput } from "$lib/interfaces/tanstack/table.types";
  import { Format } from "$lib/utils/format.util";
  import { type Item } from "$lib/utils/items.util";
  import type { Table } from "@tanstack/table-core";
  import type { Snippet } from "svelte";
  import TanstackTable from "../tanstack/TanstackTable.svelte";
  import DataTableVisibilityDropdownMenu from "./data-table-visibility-dropdown-menu.svelte";

  let {
    filters,
    ...input
  }: TanstackTableInput<TData, TValue> & {
    filters?: Snippet<[Table<TData>]>;
  } = $props();
</script>

<TanstackTable {...input}>
  {#snippet children(table)}
    {@const state = table.getState()}

    <div class="space-y-3">
      <div class="flex items-end justify-between">
        {#if filters}
          {@render filters(table)}
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
                <ShadTable.Cell
                  class="h-16 text-center"
                  colspan={table.options.columns.length}
                >
                  No results
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

        {#if state.pagination && table.options.data.length > state.pagination.pageSize}
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
        {/if}
      </div>
    </div>
  {/snippet}
</TanstackTable>
