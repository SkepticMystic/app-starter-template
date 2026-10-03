<script
  lang="ts"
  generics="T extends Resource"
>
  import type { Resource } from "#lib/utils/array/array.util.js";
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

<!-- `ItemGroup` is `role="list"`, so each row is wrapped as its `listitem` and the rules between
  them are decorative — a list whose children were rows and separators announced neither the
  count nor the position. -->
<ItemGroup class={["rounded-md border border-border bg-card shadow-sm", klass]}>
  {#each items as row, i (row.id)}
    <div role="listitem">
      {@render item(row, i)}
    </div>

    {#if separator && i < items.length - 1}
      <ItemSeparator decorative />
    {/if}
  {:else}
    <Empty {...empty}></Empty>
  {/each}
</ItemGroup>
