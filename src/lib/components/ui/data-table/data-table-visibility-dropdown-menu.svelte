<script lang="ts" generics="TData">
  import Button from "$lib/components/ui/button/button.svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
  import { TanstackTable } from "$lib/utils/tanstack/table.util";
  import { type Table } from "@tanstack/table-core";

  let {
    table,
  }: {
    table: Table<TData>;
  } = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline" icon="lucide/settings-2">
        View
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content align="end">
    <DropdownMenu.CheckboxItem
      disabled={table.getIsAllColumnsVisible()}
      bind:checked={
        () => table.getIsAllColumnsVisible(),
        () => table.toggleAllColumnsVisible(true)
      }
    >
      Show All
    </DropdownMenu.CheckboxItem>

    <DropdownMenu.Separator />

    {#each table
      .getAllColumns()
      .filter((col) => col.getCanHide()) as column (column.id)}
      <DropdownMenu.CheckboxItem
        class="capitalize"
        bind:checked={
          () => column.getIsVisible(), (value) => column.toggleVisibility(value)
        }
      >
        {TanstackTable.get_column_label(column)}
      </DropdownMenu.CheckboxItem>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
