<script
  lang="ts"
  generics="TData extends Record<string, unknown>"
>
  import Button from "$lib/components/ui/button/button.svelte";
  import { TanstackTable } from "$lib/utils/tanstack/table.util";
  import type { Table } from "@tanstack/table-core";
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import DropdownMenuCheckboxItem from "../dropdown-menu/dropdown-menu-checkbox-item.svelte";
  import DropdownMenuContent from "../dropdown-menu/dropdown-menu-content.svelte";
  import DropdownMenuGroup from "../dropdown-menu/dropdown-menu-group.svelte";
  import DropdownMenuItem from "../dropdown-menu/dropdown-menu-item.svelte";
  import DropdownMenuLabel from "../dropdown-menu/dropdown-menu-label.svelte";
  import DropdownMenuSeparator from "../dropdown-menu/dropdown-menu-separator.svelte";
  import DropdownMenuTrigger from "../dropdown-menu/dropdown-menu-trigger.svelte";

  let {
    table,
  }: {
    table: Table<TData>;
  } = $props();
</script>

<DropdownMenuPrimitive.Root>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        icon="lucide/settings-2"
      >
        Table
      </Button>
    {/snippet}
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end">
    {#if table.getState().grouping?.length}
      <DropdownMenuItem onclick={() => table.resetGrouping(true)}>
        Reset grouping
      </DropdownMenuItem>

      <DropdownMenuSeparator />
    {/if}

    <DropdownMenuGroup>
      <DropdownMenuLabel>Column Visibility</DropdownMenuLabel>

      <DropdownMenuCheckboxItem
        disabled={table.getIsAllColumnsVisible()}
        bind:checked={
          () => table.getIsAllColumnsVisible(),
          () => table.toggleAllColumnsVisible(true)
        }
      >
        All
      </DropdownMenuCheckboxItem>

      {#each table
        .getAllColumns()
        .filter((col) => col.getCanHide()) as column (column.id)}
        <DropdownMenuCheckboxItem
          closeOnSelect={false}
          bind:checked={
            () => column.getIsVisible(),
            (value) => column.toggleVisibility(value)
          }
        >
          {TanstackTable.get_column_label(column)}
        </DropdownMenuCheckboxItem>
      {/each}
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenuPrimitive.Root>
