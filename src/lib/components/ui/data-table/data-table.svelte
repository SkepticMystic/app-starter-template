<script
  lang="ts"
  generics="TData extends Item"
>
  import Button from "$lib/components/ui/button/button.svelte";
  import type { TanstackTableInput } from "$lib/interfaces/tanstack/table.types";
  import { Format } from "$lib/utils/format.util";
  import type { Item } from "$lib/utils/items.util";
  import type { Table } from "@tanstack/table-core";
  import type { Snippet } from "svelte";
  import ButtonGroup from "../button-group/button-group.svelte";
  import Checkbox from "../checkbox/checkbox.svelte";
  import DropdownMenu from "../dropdown-menu/DropdownMenu.svelte";
  import type { EmptyProps } from "../empty/empty.svelte";
  import Empty from "../empty/empty.svelte";
  import TableBody from "../table/table-body.svelte";
  import TableCell from "../table/table-cell.svelte";
  import TableFooter from "../table/table-footer.svelte";
  import TableHead from "../table/table-head.svelte";
  import TableHeader from "../table/table-header.svelte";
  import TableRoot from "../table/table-root.svelte";
  import TableRow from "../table/table-row.svelte";
  import TanstackTable from "../tanstack/TanstackTable.svelte";
  import DataTableColumnHeaderDropdownMenu from "./data-table-column-header-dropdown-menu.svelte";
  import DataTableVisibilityDropdownMenu from "./data-table-visibility-dropdown-menu.svelte";
  import FlexRender from "./flex-render.svelte";

  let {
    empty,
    header,
    columns,
    loading,
    states,
    ...input
  }: TanstackTableInput<TData> & {
    empty?: EmptyProps;
    loading?: boolean;
    header?: Snippet<[Table<TData>]>;
  } = $props();
</script>

<TanstackTable
  {...input}
  {states}
  {columns}
>
  {#snippet children(table)}
    {@const state = table.getState()}

    <div class="space-y-3">
      {@render header?.(table)}

      <div class="flex items-center justify-between">
        <ButtonGroup>
          <ButtonGroup>
            <DataTableVisibilityDropdownMenu {table} />
          </ButtonGroup>

          {#if state.pagination && input.data.length}
            <ButtonGroup>
              <Button
                variant="outline"
                title="Previous Page"
                icon="lucide/chevron-left"
                disabled={!table.getCanPreviousPage()}
                onclick={() => table.previousPage()}
              ></Button>

              <Button
                variant="outline"
                title="Go to first page"
                onclick={() => table.setPageIndex(0)}
              >
                {state.pagination.pageIndex + 1} / {table.getPageCount()}
              </Button>

              <Button
                variant="outline"
                title="Next Page"
                icon="lucide/chevron-right"
                disabled={!table.getCanNextPage()}
                onclick={() => table.nextPage()}
              ></Button>
            </ButtonGroup>
          {/if}
        </ButtonGroup>

        {#if states?.selection}
          {@const [selected_rows, total_count] = [
            table.getFilteredSelectedRowModel().rows,
            table.getFilteredRowModel().rows.length,
          ]}

          {@const label = `${Format.number(
            selected_rows.length,
          )} of ${Format.number(total_count)} rows selected`}

          {#if input.bulk_actions}
            <DropdownMenu
              {label}
              icon=""
              variant="outline"
              items={input.bulk_actions(selected_rows).map((item) => {
                if (item.kind === undefined || item.kind === "item") {
                  item.disabled = item.disabled || selected_rows.length === 0;
                }
                return item;
              })}
            ></DropdownMenu>
          {:else}
            <div class="text-sm text-muted-foreground">{label}</div>
          {/if}
        {:else}
          <div></div>
        {/if}
      </div>

      <div>
        <TableRoot>
          <TableHeader>
            {#each table.getHeaderGroups() as header_group (header_group.id)}
              <TableRow>
                {#if states?.selection}
                  <TableHead>
                    <Checkbox
                      aria-label="Select all"
                      checked={table.getIsAllPageRowsSelected()}
                      indeterminate={table.getIsSomePageRowsSelected() &&
                        !table.getIsAllPageRowsSelected()}
                      onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(value)}
                    />
                  </TableHead>
                {/if}

                {#each header_group.headers as header (header.id)}
                  <TableHead colspan={header.colSpan}>
                    {#if !header.isPlaceholder}
                      {#if header.column.columnDef.enableSorting !== false || header.column.columnDef.enableHiding !== false}
                        <DataTableColumnHeaderDropdownMenu
                          column={header.column}
                        />
                      {:else}
                        <FlexRender
                          context={header.getContext()}
                          content={header.column.columnDef.header}
                        />
                      {/if}
                    {/if}
                  </TableHead>
                {/each}

                {#if input.actions}
                  <TableHead>Actions</TableHead>
                {/if}
              </TableRow>
            {/each}
          </TableHeader>

          <TableBody>
            {#each table.getRowModel().rows as row (row.id)}
              <TableRow
                data-state={states?.selection &&
                  row.getIsSelected() &&
                  "selected"}
              >
                {#if states?.selection}
                  <TableCell>
                    <Checkbox
                      aria-label="Select row"
                      checked={row.getIsSelected()}
                      onCheckedChange={(value) => row.toggleSelected(value)}
                    />
                  </TableCell>
                {/if}

                {#each row.getVisibleCells() as cell (cell.id)}
                  <TableCell id={cell.id}>
                    {#if cell.getIsGrouped()}
                      <FlexRender
                        context={cell.getContext()}
                        content={cell.column.columnDef.aggregatedCell ??
                          cell.column.columnDef.cell}
                      />
                      ({Format.number(row.subRows.length)})
                    {:else if cell.getIsAggregated()}
                      <FlexRender
                        context={cell.getContext()}
                        content={cell.column.columnDef.aggregatedCell ??
                          cell.column.columnDef.cell}
                      />
                    {:else}
                      <FlexRender
                        context={cell.getContext()}
                        content={cell.column.columnDef.cell}
                      />
                    {/if}
                  </TableCell>
                {/each}

                {#if input.actions}
                  <TableCell>
                    <DropdownMenu
                      size="icon-sm"
                      items={input.actions(row)}
                    />
                  </TableCell>
                {/if}
              </TableRow>
            {:else}
              <TableRow>
                <TableCell
                  colspan={table.options.columns.length +
                    (states?.selection ? 1 : 0) +
                    (input.actions ? 1 : 0)}
                >
                  <Empty
                    {loading}
                    title="No results"
                    icon="lucide/inbox"
                    {...empty}
                  ></Empty>
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>

          <TableFooter>
            {#each table.getFooterGroups() as footer_group (footer_group.id)}
              <TableRow>
                {#if states?.selection}
                  <TableHead colspan={1}></TableHead>
                {/if}

                {#each footer_group.headers as header (header.id)}
                  <TableHead colspan={header.colSpan}>
                    {#if !header.isPlaceholder}
                      <FlexRender
                        context={header.getContext()}
                        content={header.column.columnDef.footer}
                      />
                    {/if}
                  </TableHead>
                {/each}

                {#if input.actions}
                  <TableHead colspan={1}></TableHead>
                {/if}
              </TableRow>
            {/each}
          </TableFooter>
        </TableRoot>
      </div>
    </div>
  {/snippet}
</TanstackTable>
