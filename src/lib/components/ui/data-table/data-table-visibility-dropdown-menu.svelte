<script lang="ts" generics="TData">
  import Button from "$lib/components/ui/button/button.svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
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
      <Button {...props} variant="outline">Columns</Button>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content align="end">
    {#if !table.getIsAllColumnsVisible()}
      <DropdownMenu.CheckboxItem
        bind:checked={
          () => table.getIsAllColumnsVisible(),
          (value) => table.toggleAllColumnsVisible(value)
        }
      >
        Show All
      </DropdownMenu.CheckboxItem>

      <DropdownMenu.Separator />
    {/if}

    {#each table.getAllColumns().filter((col) => col.getCanHide()) as column}
      <DropdownMenu.CheckboxItem
        class="capitalize"
        bind:checked={
          () => column.getIsVisible(), (value) => column.toggleVisibility(value)
        }
      >
        {column.id}
      </DropdownMenu.CheckboxItem>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
