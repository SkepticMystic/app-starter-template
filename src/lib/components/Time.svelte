<script lang="ts">
  import { Dates } from "$lib/utils/dates";
  import type { ClassValue } from "svelte/elements";

  let {
    date,
    title,
    class: klass = "",
    show = Dates.show_date,
  }: {
    title?: string;
    class?: ClassValue;
    date: Date | string | number | undefined | null;
    show?: (dt: Date | number | string | undefined | null) => string;
  } = $props();
</script>

{#if date}
  <time {title} class={klass} datetime={new Date(date).toISOString()}>
    {show(date)}
  </time>
{:else}
  <span {title} class={klass}>
    {show(date)}
  </span>
{/if}
