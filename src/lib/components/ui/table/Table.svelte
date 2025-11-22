<script
  lang="ts"
  generics="T extends Record<string, unknown>"
>
  import * as Table from "$lib/components/ui/table/index.js";
  import type { Item } from "$lib/utils/items.util";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

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

<Table.Root class={klass}>
  {#if caption}
    <Table.Caption>
      {@render caption()}
    </Table.Caption>
  {/if}

  <Table.Header>
    <Table.Row>
      {@render header()}
    </Table.Row>
  </Table.Header>

  <Table.Body>
    {#each data as item, i (item.id)}
      <Table.Row>
        {@render row(item, i)}
      </Table.Row>
    {/each}
  </Table.Body>

  {#if footer}
    <Table.Footer>
      <Table.Row>
        {@render footer()}
      </Table.Row>
    </Table.Footer>
  {/if}
</Table.Root>
