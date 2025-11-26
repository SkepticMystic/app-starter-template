<script
  lang="ts"
  generics="T extends Record<string, unknown>"
>
  import type { Item } from "$lib/utils/items.util";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import TableBody from "./table-body.svelte";
  import TableCaption from "./table-caption.svelte";
  import TableFooter from "./table-footer.svelte";
  import TableHeader from "./table-header.svelte";
  import TableRoot from "./table-root.svelte";
  import TableRow from "./table-row.svelte";

  let {
    row,
    data,
    header,
    footer,
    caption,
    class: klass,
  }: {
    data: Item<T>[];
    class?: ClassValue;
    row: Snippet<[Item<T>, number]>;
    caption?: Snippet;
    header: Snippet<[]>;
    footer?: Snippet;
  } = $props();
</script>

<TableRoot class={klass}>
  {#if caption}
    <TableCaption>
      {@render caption()}
    </TableCaption>
  {/if}

  <TableHeader>
    <TableRow>
      {@render header()}
    </TableRow>
  </TableHeader>

  <TableBody>
    {#each data as item, i (item.id)}
      <TableRow>
        {@render row(item, i)}
      </TableRow>
    {/each}
  </TableBody>

  {#if footer}
    <TableFooter>
      <TableRow>
        {@render footer()}
      </TableRow>
    </TableFooter>
  {/if}
</TableRoot>
