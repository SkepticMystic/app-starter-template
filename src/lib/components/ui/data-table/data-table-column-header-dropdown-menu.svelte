<script
  lang="ts"
  generics="TData extends Record<string, unknown>"
>
  import Button from "$lib/components/ui/button/button.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import { TanstackTable, type Features } from "$lib/utils/tanstack/table.util";
  import { FlexRender, type Header } from "@tanstack/svelte-table";
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import DropdownMenuCheckboxItem from "../dropdown-menu/dropdown-menu-checkbox-item.svelte";
  import DropdownMenuContent from "../dropdown-menu/dropdown-menu-content.svelte";
  import DropdownMenuItem from "../dropdown-menu/dropdown-menu-item.svelte";
  import DropdownMenuRadioGroup from "../dropdown-menu/dropdown-menu-radio-group.svelte";
  import DropdownMenuRadioItem from "../dropdown-menu/dropdown-menu-radio-item.svelte";
  import DropdownMenuSeparator from "../dropdown-menu/dropdown-menu-separator.svelte";
  import DropdownMenuTrigger from "../dropdown-menu/dropdown-menu-trigger.svelte";

  let {
    header,
  }: {
    /**
     * The whole header, not just its column, so the trigger can render whatever
     * the caller declared — see the `FlexRender` below.
     */
    header: Header<Features, TData>;
  } = $props();

  const column = $derived(header.column);
  const sort_dir = $derived(column.getIsSorted());
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

        <!--
          The column's own header, rather than a string rebuilt from `meta.label`.
          This used to be an either/or — a column that could sort got the menu and
          lost its header — which is why `meta.label` existed. `DEFAULT_COLUMN` now
          routes `meta.label` through the header, so a plain column renders exactly
          what it did before and a column with a real header finally keeps it.
        -->
        <FlexRender {header} />

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

    {#if TanstackTable.can_group(column)}
      <DropdownMenuCheckboxItem
        bind:checked={
          () => column.getIsGrouped(), () => column.toggleGrouping()
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
