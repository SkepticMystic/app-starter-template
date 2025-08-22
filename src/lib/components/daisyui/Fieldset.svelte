<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    label,
    legend,
    class: klass,

    children,
  }: {
    class?: string;
    label?: string;
    legend: string;
    children?: Snippet;
  } = $props();
</script>

<fieldset class="fieldset {klass}">
  <legend class="fieldset-legend mb-0 text-base">{legend}</legend>

  {@render children?.()}

  {#if label}
    <p class="fieldset-label">{label}</p>
  {/if}
</fieldset>
