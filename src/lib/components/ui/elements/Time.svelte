<script lang="ts">
  import { Format } from "$lib/utils/format.util";
  import type { ClassValue } from "svelte/elements";

  let {
    date,
    title,
    fallback,
    show = "date",
    class: klass = "",
  }: {
    title?: string;
    fallback?: string;
    class?: ClassValue;
    date: Date | string | number | undefined | null;
    show?:
      | "date"
      | "datetime"
      | ((dt: Date | number | string | undefined | null) => string);
  } = $props();

  // An unparseable date yields an `Invalid Date`, which is a truthy object —
  // so a bare `date ? new Date(date) : null` reaches `toISOString()` and throws
  // a RangeError, taking the whole page's render down over one bad timestamp.
  const resolved = $derived.by(() => {
    if (!date) return null;

    const dt = new Date(date);

    return Number.isNaN(dt.getTime()) ? null : dt;
  });

  const format = $derived(typeof show === "string" ? Format[show] : show);
</script>

{#if resolved}
  <time
    class={klass}
    datetime={resolved.toISOString()}
    title={title ?? resolved.toISOString()}
  >
    {format(resolved)}
  </time>
{:else}
  <span
    {title}
    class={klass}
  >
    {fallback ?? format(resolved)}
  </span>
{/if}
