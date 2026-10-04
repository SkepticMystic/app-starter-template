<script lang="ts">
  import { type WithElementRef } from "#lib/utils/shadcn.util.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    heading,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> & {
    /** Render as a heading, for a card that is the page's main content. */
    heading?: "h1" | "h2" | "h3";
  } = $props();
</script>

<svelte:element
  this={heading ?? "div"}
  bind:this={ref}
  data-slot="card-title"
  class={["leading-none font-semibold", className]}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
