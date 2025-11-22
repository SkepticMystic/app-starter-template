<script
  lang="ts"
  generics="T extends Record<string, unknown>"
>
  import ExtractSnippet from "$lib/components/util/ExtractSnippet.svelte";
  import type { MaybeSnippet } from "$lib/interfaces/svelte/svelte.types";
  import { cn } from "$lib/utils/shadcn.util";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import Empty, { type EmptyProps } from "../empty/empty.svelte";
  import ItemGroup from "./item-group.svelte";
  import ItemSeparator from "./item-separator.svelte";

  let {
    key,
    item,
    items,
    empty,
    title,
    class: klass,
    separator = true,
  }: {
    items: T[];
    empty?: EmptyProps;
    class?: ClassValue;
    separator?: boolean;
    title?: MaybeSnippet;
    item: Snippet<[T, number]>;
    key?: keyof T | ((item: T) => string | number);
  } = $props();
</script>

{#if items.length}
  <div class="flex flex-col gap-2">
    {#if title}
      <ExtractSnippet snippet={title} />
    {/if}

    <ItemGroup
      class={cn("rounded-md border border-border bg-card shadow-sm", klass)}
    >
      {#each items as row, i (typeof key === "function" ? key?.(row) : key ? row[key] : i)}
        {@render item(row, i)}
        {#if separator && i < items.length - 1}
          <ItemSeparator />
        {/if}
      {/each}
    </ItemGroup>
  </div>
{:else if empty}
  <Empty {...empty}></Empty>
{/if}
