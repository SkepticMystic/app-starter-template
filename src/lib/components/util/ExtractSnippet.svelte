<!-- Keyword 'extract' taken from runed.dev extract util -->

<script lang="ts">
  import type { MaybeSnippet } from "$lib/interfaces/svelte/svelte.types";

  let {
    snippet,
  }: {
    snippet?: MaybeSnippet;
  } = $props();
</script>

{#if typeof snippet === "string"}
  {snippet}
{:else}
  {@render snippet?.()}
{/if}
