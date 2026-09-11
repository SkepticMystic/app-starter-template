<script
  lang="ts"
  module
>
  import { tv } from "tailwind-variants";

  /**
   * What a server-driven search box waits before it navigates — a request per
   * keystroke is a network round trip per character. Client tables wait nothing:
   * filtering is a pass over an array already in memory.
   */
  const SEARCH_DEBOUNCE_MS = 300;

  /**
   * How a cell behaves once its column declares a `meta.width`: a block wrapper
   * inside the `<td>`, because `max-width` on a `table-cell` is ignorable and
   * `ellipsis` needs a block box to apply to.
   */
  const cellVariants = tv({
    base: "block",

    variants: {
      width: {
        xs: "max-w-24",
        sm: "max-w-32",
        md: "max-w-48",
        lg: "max-w-64",
        xl: "max-w-96",
      },

      wrap: {
        // `whitespace-normal` because `table-cell.svelte` sets `nowrap` on the
        // way in, and `wrap-anywhere` so a URL breaks mid-token instead of
        // pushing the column past its max.
        true: "wrap-anywhere whitespace-normal",
        false: "truncate",
      },
    },

    defaultVariants: { wrap: false },
  });
</script>

<script
  lang="ts"
  generics="TData extends Resource"
>
  import Button from "$lib/components/ui/button/button.svelte";
  import type {
    DataTableFilter,
    TanstackTableInput,
  } from "$lib/interfaces/tanstack/table.type";
  import type { Resource } from "$lib/utils/array/array.util";
  import { Format } from "$lib/utils/format.util";
  import {
    DEFAULT_COLUMN,
    TanstackTable as TanstackTableUtil,
    type Features,
  } from "$lib/utils/tanstack/table.util";
  import { TableFilters } from "$lib/utils/tanstack/table_filter.util";
  import { FlexRender, type Table } from "@tanstack/svelte-table";
  import type { Snippet } from "svelte";
  import ButtonGroup from "../button-group/button-group.svelte";
  import Checkbox from "../checkbox/checkbox.svelte";
  import DropdownMenu from "../dropdown-menu/DropdownMenu.svelte";
  import type { EmptyProps } from "../empty/empty.svelte";
  import Empty from "../empty/empty.svelte";
  import Paginator from "../pagination/Paginator.svelte";
  import TableBody from "../table/table-body.svelte";
  import TableCell from "../table/table-cell.svelte";
  import TableFooter from "../table/table-footer.svelte";
  import TableHead from "../table/table-head.svelte";
  import TableHeader from "../table/table-header.svelte";
  import TableRoot from "../table/table-root.svelte";
  import TableRow from "../table/table-row.svelte";
  import TanstackTable from "../tanstack/TanstackTable.svelte";
  import DataTableColumnHeaderDropdownMenu from "./data-table-column-header-dropdown-menu.svelte";
  import DataTableToolbar from "./data-table-toolbar.svelte";
  import DataTableVisibilityDropdownMenu from "./data-table-visibility-dropdown-menu.svelte";

  let {
    empty,
    header,
    noun,
    server,
    toolbar,
    columns,
    filters,
    loading,
    states,
    search_placeholder = "Search",
    ...input
  }: TanstackTableInput<TData> & {
    /**
     * The empty state, or a function of whether the table is currently narrowed.
     * "No rows" and "no rows *matching that*" want different copy, and a page
     * re-deriving that boolean for itself drifts from the one the table used.
     */
    empty?: EmptyProps | ((ctx: { filtering: boolean }) => EmptyProps);
    loading?: boolean;
    header?: Snippet<[Table<Features, TData>]>;
    /**
     * What one row is called, so the toolbar can say how many there are. A tuple
     * for an irregular plural — `["delivery", "deliveries"]`.
     */
    noun?: string | [string, string];
    /**
     * Rendered beside the filters, for a control that acts on what they matched.
     * Distinct from `header`, which is prose *about* the table.
     */
    toolbar?: Snippet<[Table<Features, TData>]>;
    /**
     * The controls that narrow this table, declared rather than wired. Each
     * names a column id and the toolbar does the reading and writing.
     */
    filters?: DataTableFilter[];
    /** Only rendered when `states.global_filter` opts the table in. */
    search_placeholder?: string;
  } = $props();

  /**
   * Whether the click that is about to toggle a row held shift. Read
   * synchronously by `onCheckedChange`, so it needs no state, and captured on the
   * cell so it lands before the checkbox's own handler.
   */
  let range_select = false;
</script>

<TanstackTable
  {...input}
  {states}
  {server}
  {columns}
>
  {#snippet children(table)}
    <!-- v9 replaces `getState()` with per-slice atoms. -->
    {@const pagination = table.atoms.pagination.get()}
    {@const page_count = table.getPageCount()}
    {@const footer_groups = table.getFooterGroups()}
    {@const global_enabled = table.options.enableGlobalFilter ?? false}
    <!-- Where a control's current value lives is the one thing that differs
         between the two modes: a client table holds it on the column, a
         server-driven one in the URL that produced the rows. -->
    {@const filter_values = server
      ? TableFilters.read_params(filters ?? [], server.params)
      : Object.fromEntries(
          (filters ?? []).map((filter) => [
            filter.id,
            table.getColumn(filter.id)?.getFilterValue(),
          ]),
        )}
    <!-- The options for any `multi` that declared none, taken from the column
         itself. Computed here rather than in the toolbar, which renders
         declarations and holds no table. -->
    {@const facets = Object.fromEntries(
      (filters ?? [])
        .filter((filter) => filter.kind === "multi" && !filter.options)
        .map((filter) => [
          filter.id,
          TableFilters.facet_options(
            table.getColumn(filter.id)?.getFacetedUniqueValues(),
          ),
        ]),
    )}
    {@const has_controls = Boolean(filters?.length) || global_enabled}
    <!-- Whether Clear would do anything, which is not "is any filter set": a
         client table is measured against the view the page seeded, a
         server-driven one is asked of the URL. -->
    {@const filtering =
      has_controls &&
      (server
        ? TableFilters.is_filtering_params(filters ?? [], server.params)
        : TableFilters.is_filtering_columns(
            table.atoms.columnFilters.get(),
            table.initialState.columnFilters,
          ) ||
          (table.atoms.globalFilter.get() ?? "") !==
            table.initialState.globalFilter)}

    <div class="space-y-3">
      {@render header?.(table)}

      <div class="flex flex-wrap items-end justify-between gap-2">
        <div class="flex flex-wrap items-end gap-2">
          <DataTableToolbar
            {filters}
            {filtering}
            {facets}
            values={filter_values}
            debounce_ms={server ? SEARCH_DEBOUNCE_MS : 0}
            global_search={global_enabled
              ? {
                  placeholder: search_placeholder,
                  value: table.atoms.globalFilter.get() ?? "",
                  onchange: (value) => table.setGlobalFilter(value),
                }
              : undefined}
            onchange={(filter, value) =>
              server
                ? server.on_change(TableFilters.write_param(filter, value))
                : table.getColumn(filter.id)?.setFilterValue(value)}
            onclear={() => {
              if (server) {
                server.on_change(TableFilters.clear_params(filters ?? []));
                return;
              }

              /* The search box is a *global* filter, so it is not in
                 `columnFilters` and would survive a Clear that reset only those.
                 `reset*` not `set*("")`: both restore `initialState`. */
              table.resetColumnFilters();
              if (global_enabled) table.resetGlobalFilter();
            }}
          />

          {@render toolbar?.(table)}

          <ButtonGroup>
            <DataTableVisibilityDropdownMenu {table} />
          </ButtonGroup>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          {#if noun}
            <p class="text-sm text-muted-foreground">
              {TanstackTableUtil.count_label(table.getRowCount(), noun)}
            </p>
          {/if}

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
          {/if}
        </div>
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
                      {#if header.column.getCanSort() || header.column.getCanHide() || TanstackTableUtil.can_group(header.column)}
                        <DataTableColumnHeaderDropdownMenu {header} />
                      {:else}
                        <FlexRender {header} />
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
                  {@const toggle_selected = row.getToggleSelectedHandler()}

                  <TableCell
                    onclickcapture={(e) => (range_select = e.shiftKey)}
                  >
                    <!-- NOTE: v9's handler wants a checkbox event, not a bool.
                         Feeding it `shiftKey` is what buys shift-click ranges. -->
                    <Checkbox
                      aria-label="Select row"
                      checked={row.getIsSelected()}
                      onCheckedChange={(checked) =>
                        toggle_selected({
                          target: { checked },
                          shiftKey: range_select,
                        })}
                    />
                  </TableCell>
                {/if}

                {#each row.getVisibleCells() as cell (cell.id)}
                  {@const meta = cell.column.columnDef.meta}

                  <TableCell id={cell.id}>
                    {#if cell.getIsGrouped()}
                      {@const toggle_expanded = row.getToggleExpandedHandler()}

                      <!-- The count says how many rows the group holds; the
                           chevron is the only way to see them. Without it,
                           grouping was a one-way door. -->
                      <span class="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={row.getIsExpanded() ? "Collapse" : "Expand"}
                          aria-expanded={row.getIsExpanded()}
                          disabled={!row.getCanExpand()}
                          icon={row.getIsExpanded()
                            ? "lucide/chevron-down"
                            : "lucide/chevron-right"}
                          onclick={toggle_expanded}
                        ></Button>

                        <FlexRender {cell} />

                        ({Format.number(row.subRows.length)})
                      </span>
                    {:else if meta?.width}
                      <!-- `getValue()` is the *accessor* value, only what the
                           reader sees while the column renders it directly —
                           `DEFAULT_COLUMN.cell` is how that is asked. -->
                      {@const renders_value =
                        cell.column.columnDef.cell === DEFAULT_COLUMN.cell}

                      <div
                        class={cellVariants({
                          width: meta.width,
                          wrap: meta.wrap,
                        })}
                        title={TanstackTableUtil.cell_title(
                          cell.getValue(),
                          renders_value,
                        )}
                      >
                        <FlexRender {cell} />
                      </div>
                    {:else}
                      <!-- NOTE: FlexRender picks `aggregatedCell` for aggregated
                           cells and blanks placeholders on its own -->
                      <FlexRender {cell} />
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
                  colspan={TanstackTableUtil.empty_colspan({
                    visible_leaf_columns: table.getVisibleLeafColumns().length,
                    selection: !!states?.selection,
                    actions: !!input.actions,
                  })}
                >
                  <Empty
                    {loading}
                    title="No results"
                    icon="lucide/inbox"
                    {...typeof empty === "function"
                      ? empty({ filtering })
                      : empty}
                  ></Empty>
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>

          {#if footer_groups.some( (g) => g.headers.some((h) => h.column.columnDef.footer) )}
            <TableFooter>
              {#each footer_groups as footer_group (footer_group.id)}
                <TableRow>
                  {#if states?.selection}
                    <TableHead colspan={1}></TableHead>
                  {/if}

                  {#each footer_group.headers as footer (footer.id)}
                    <TableHead colspan={footer.colSpan}>
                      {#if !footer.isPlaceholder}
                        <FlexRender {footer} />
                      {/if}
                    </TableHead>
                  {/each}

                  {#if input.actions}
                    <TableHead colspan={1}></TableHead>
                  {/if}
                </TableRow>
              {/each}
            </TableFooter>
          {/if}
        </TableRoot>
      </div>

      <!-- The same `Paginator` the server-driven pages render as a sibling. Its
           vocabulary is `skip`/`limit`/`total`, which is what a list query
           speaks, so the client side is what translates. -->
      {#if page_count > 1}
        <div class="flex justify-end">
          <Paginator
            skip={TanstackTableUtil.offset_of_page(pagination)}
            limit={pagination.pageSize}
            total={table.getRowCount()}
            has_more={table.getCanNextPage()}
            onchange={(skip, limit) =>
              server
                ? /* `skip || null` so page one has a clean URL — absent is how
                     this app spells the default, and the load's schema supplies
                     it. */
                  server.on_change({ offset: skip || null })
                : table.setPagination(
                    TanstackTableUtil.page_of_offset(skip, limit),
                  )}
          />
        </div>
      {/if}
    </div>
  {/snippet}
</TanstackTable>
