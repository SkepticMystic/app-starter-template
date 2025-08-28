<script lang="ts" generics="T extends Record<string, unknown>">
  import type { Item } from "$lib/utils/items.util";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  let {
    row,
    items,
    header,
    class: klass = "",
  }: {
    items: Item<T>[];
    class?: ClassValue;
    header?: Snippet<[]>;
    row: Snippet<[Item<T>, number]>;
  } = $props();
</script>

<ul class="list {klass} rounded-box border bg-base-100 shadow-md" role="list">
  {@render header?.()}

  {#each items as item, i (item.id)}
    <li class="list-row items-center px-3 py-3" role="listitem">
      {@render row(item, i)}
    </li>
  {/each}
</ul>
