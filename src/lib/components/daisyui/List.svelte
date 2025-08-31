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

<ul class="{klass} bg-base-100 rounded-md border shadow" role="list">
  {@render header?.()}

  {#each items as item, i (item.id)}
    <li
      role="listitem"
      class="flex items-center gap-2 border-b px-3 py-3 last:border-0"
    >
      {@render row(item, i)}
    </li>
  {/each}
</ul>
