<script lang="ts" generics="TData">
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
  import { TanstackTable } from "$lib/utils/tanstack/table.util";
  import type { Column } from "@tanstack/table-core";

  let {
    column,
  }: {
    column: Column<TData, unknown>;
  } = $props();

  const sort_dir = $derived(column.getIsSorted());
  const label = TanstackTable.get_column_label(column);
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" class="-ml-4">
        {label}

        <Icon
          icon={sort_dir === "desc"
            ? "lucide/arrow-down"
            : sort_dir === "asc"
              ? "lucide/arrow-up"
              : ""}
        />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content align="end">
    {#if column.getCanSort()}
      <DropdownMenu.CheckboxItem
        bind:checked={
          () => sort_dir === "asc",
          (sort_asc) => column.toggleSorting(!sort_asc)
        }
      >
        Sort asc
      </DropdownMenu.CheckboxItem>

      <DropdownMenu.CheckboxItem
        bind:checked={
          () => sort_dir === "desc",
          (sort_desc) => column.toggleSorting(sort_desc)
        }
      >
        Sort desc
      </DropdownMenu.CheckboxItem>

      <DropdownMenu.Separator />
    {/if}

    {#if column.getCanHide()}
      <DropdownMenu.CheckboxItem
        class="capitalize"
        bind:checked={() => false, () => column.toggleVisibility(false)}
      >
        Hide column
      </DropdownMenu.CheckboxItem>
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>
