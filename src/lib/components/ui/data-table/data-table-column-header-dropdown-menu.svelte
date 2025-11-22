<script
  lang="ts"
  generics="TData"
>
  import Button from "$lib/components/ui/button/button.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import { TanstackTable } from "$lib/utils/tanstack/table.util";
  import type { Column } from "@tanstack/table-core";
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import DropdownMenuCheckboxItem from "../dropdown-menu/dropdown-menu-checkbox-item.svelte";
  import DropdownMenuContent from "../dropdown-menu/dropdown-menu-content.svelte";
  import DropdownMenuSeparator from "../dropdown-menu/dropdown-menu-separator.svelte";
  import DropdownMenuTrigger from "../dropdown-menu/dropdown-menu-trigger.svelte";

  let {
    column,
  }: {
    column: Column<TData, unknown>;
  } = $props();

  const sort_dir = $derived(column.getIsSorted());
  const label = TanstackTable.get_column_label(column);
</script>

<DropdownMenuPrimitive.Root>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        class="-ml-2"
      >
        <Icon icon={column.getIsGrouped() ? "lucide/group" : undefined} />

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
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end">
    {#if column.getCanSort()}
      <DropdownMenuCheckboxItem
        bind:checked={
          () => sort_dir === "asc",
          (sort_asc) => column.toggleSorting(!sort_asc)
        }
      >
        Sort asc
      </DropdownMenuCheckboxItem>

      <DropdownMenuCheckboxItem
        bind:checked={
          () => sort_dir === "desc",
          (sort_desc) => column.toggleSorting(sort_desc)
        }
      >
        Sort desc
      </DropdownMenuCheckboxItem>

      <DropdownMenuSeparator />
    {/if}

    <!-- NOTE: We still do a null chain because the type: boolean is a lie... it can be undefined -->
    {#if column.columnDef.enableGrouping === true}
      <DropdownMenuCheckboxItem
        bind:checked={
          () => column.getIsGrouped() ?? false, () => column.toggleGrouping()
        }
      >
        Group by
      </DropdownMenuCheckboxItem>
    {/if}

    {#if column.getCanHide()}
      <DropdownMenuCheckboxItem
        class="capitalize"
        bind:checked={() => false, () => column.toggleVisibility(false)}
      >
        Hide column
      </DropdownMenuCheckboxItem>
    {/if}
  </DropdownMenuContent>
</DropdownMenuPrimitive.Root>
