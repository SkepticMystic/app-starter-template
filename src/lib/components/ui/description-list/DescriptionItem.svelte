<script lang="ts">
  import { EMPTY } from "#lib/utils/format.util.js";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  let {
    label,
    value,
    children,
    class: klass,
  }: {
    label: string;
    /** A plain value. `null`, `undefined` and `""` show {@link EMPTY}. */
    value?: string | number | null;
    /** Anything richer than a string — a `Time`, a link, a badge. Wins over `value`. */
    children?: Snippet;
    class?: ClassValue;
  } = $props();
</script>

<!-- `min-w-0` so a long value (a URL, an id) wraps inside its column instead of widening it. -->
<div class={["min-w-0", klass]}>
  <dt class="text-xs font-medium text-muted-foreground">{label}</dt>
  <dd class="mt-1 text-sm wrap-anywhere">
    {#if children}
      {@render children()}
    {:else}
      {value === null || value === undefined || value === "" ? EMPTY : value}
    {/if}
  </dd>
</div>
