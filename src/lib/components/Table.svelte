<script lang="ts" generics="T extends Record<string, unknown>">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  let {
    row,
    data,
    header,
    footer,
    class: klass = "table-pin-rows",
  }: {
    data: T[];
    class?: ClassValue;
    row: Snippet<[T, number]>;
    header: Snippet<[]>;
    footer?: Snippet;
  } = $props();
</script>

<div
  class="rounded-box border-base-content/10 bg-base-100 overflow-x-auto border"
>
  <table class="table {klass}">
    <thead>
      <tr class="bg-base-200 shadow-sm">
        {@render header()}
      </tr>
    </thead>

    <tbody class="">
      {#each data as item, i (item.id)}
        {@render row(item, i)}
      {/each}
    </tbody>

    {#if footer}
      <tfoot>
        <tr class="bg-base-200">
          {@render footer()}
        </tr>
      </tfoot>
    {/if}
  </table>
</div>
