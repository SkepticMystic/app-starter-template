<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    children,
    aside,
  }: {
    /** The record's substance: activity, tables, editors. */
    children: Snippet;
    /** Its facts — a "Details" card with a `DescriptionList`, then anything else small. */
    aside: Snippet;
  } = $props();
</script>

<!--
  A detail page's two columns: the main one, and a sidebar of facts. Below `lg` the sidebar
  follows the main column, which is also its reading order. Not sticky: a sidebar taller than
  a laptop screen, stuck in place, hides its own bottom.
-->
<div
  class="
    grid items-start gap-6
    lg:grid-cols-[minmax(0,1fr)_20rem]
  "
>
  <div class="min-w-0 space-y-6">
    {@render children()}
  </div>

  <aside class="min-w-0 space-y-6">
    {@render aside()}
  </aside>
</div>
