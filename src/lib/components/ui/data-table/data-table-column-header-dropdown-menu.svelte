<script
  lang="ts"
  generics="TData extends Record<string, unknown>"
>
  import Button from "$lib/components/ui/button/button.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import { TanstackTable, type Features } from "$lib/utils/tanstack/table.util";
  import type { Column } from "@tanstack/svelte-table";
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import DropdownMenuCheckboxItem from "../dropdown-menu/dropdown-menu-checkbox-item.svelte";
  import DropdownMenuContent from "../dropdown-menu/dropdown-menu-content.svelte";
  import DropdownMenuItem from "../dropdown-menu/dropdown-menu-item.svelte";
  import DropdownMenuRadioGroup from "../dropdown-menu/dropdown-menu-radio-group.svelte";
  import DropdownMenuRadioItem from "../dropdown-menu/dropdown-menu-radio-item.svelte";
  import DropdownMenuSeparator from "../dropdown-menu/dropdown-menu-separator.svelte";
  import DropdownMenuTrigger from "../dropdown-menu/dropdown-menu-trigger.svelte";

  let {
    column,
  }: {
    column: Column<Features, TData, unknown>;
  } = $props();

  const sort_dir = $derived(column.getIsSorted());
  const label = $derived(TanstackTable.get_column_label(column));
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
      <!--
        One radio group, not two checkboxes. `toggleSorting(desc)` called with an
        explicit boolean sets `hasManualValue`, which excludes the "remove sort"
        branch — so unticking "Sort asc" applied *descending*, and no amount of
        clicking ever returned the column to unsorted. A three-way choice says
        what the states actually are and gives "None" somewhere to live.
      -->
      <DropdownMenuRadioGroup
        bind:value={
          () => sort_dir || "none",
          (next) => {
            if (next === "none") column.clearSorting();
            else column.toggleSorting(next === "desc");
          }
        }
      >
        <DropdownMenuRadioItem value="asc">Sort asc</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="desc">Sort desc</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="none">No sort</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>

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
      <!-- An action, not a checkbox offering an "off" that is already off. -->
      <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
        Hide column
      </DropdownMenuItem>
    {/if}
  </DropdownMenuContent>
</DropdownMenuPrimitive.Root>
