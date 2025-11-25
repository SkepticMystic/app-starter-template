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

  const resolved = date ? new Date(date) : null;

  const format = typeof show === "string" ? Format[show] : show;
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
