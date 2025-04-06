<script lang="ts" generics="T extends SID<Record<string, unknown>>">
  import type { SID } from "$lib/interfaces";
  import type { Snippet } from "svelte";

  let {
    row,
    data,
    header,
    footer,
    class: klass = "table-pin-rows table-sm",
  }: {
    data: T[];
    class?: string;
    row: Snippet<[T, number]>;
    header: Snippet<[]>;
    footer?: Snippet;
  } = $props();
</script>

<div class="ring-neutral/5 shadow-md ring-1 md:rounded-sm">
  <table class="table {klass}">
    <thead>
      <tr class="bg-base-200 shadow-sm">{@render header()}</tr>
    </thead>

    <tbody class="bg-base-100">
      {#each data as item, i (item._id)}
        {@render row(item, i)}
      {/each}
    </tbody>

    {#if footer}
      <tfoot>
        <tr class="bg-base-200 border-t-base-200">
          {@render footer()}
        </tr>
      </tfoot>
    {/if}
  </table>
</div>
