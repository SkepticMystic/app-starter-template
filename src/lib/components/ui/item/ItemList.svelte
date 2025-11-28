<script
  lang="ts"
  generics="T extends Item"
>
  import type { Item } from "$lib/utils/items.util";
  import { cn } from "$lib/utils/shadcn.util";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import Empty, { type EmptyProps } from "../empty/empty.svelte";
  import ItemGroup from "./item-group.svelte";
  import ItemSeparator from "./item-separator.svelte";

  let {
    item,
    items,
    empty,
    class: klass,
    separator = true,
  }: {
    items: T[];
    empty?: EmptyProps;
    class?: ClassValue;
    separator?: boolean;
    item: Snippet<[T, number]>;
  } = $props();
</script>

<ItemGroup
  class={cn("rounded-md border border-border bg-card shadow-sm", klass)}
>
  {#each items as row, i (row.id)}
    {@render item(row, i)}

    {#if separator && i < items.length - 1}
      <ItemSeparator />
    {/if}
  {:else}
    <Empty {...empty}></Empty>
  {/each}
</ItemGroup>
