<script
  lang="ts"
  module
>
  // `full` needs `max-w-none`, not nothing: the base `article` rule adds `sm:container`.
  const WIDTHS = {
    narrow: "max-w-3xl",
    default: "max-w-7xl",
    wide: "max-w-(--breakpoint-2xl)",
    full: "max-w-none",
  } as const;

  export type PageWidth = keyof typeof WIDTHS;
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  let {
    children,
    width = "default",
    flush = false,
    as = "article",
    class: klass,
  }: {
    children: Snippet;
    /** How wide the page's content may grow. `narrow` for a lone form, `full` for a table or
     * board that should use the whole screen. */
    width?: PageWidth;
    /** Edge to edge: no gutter or vertical margin, and it grows to the footer — for a canvas,
     * map or split-pane editor that draws its own insets. */
    flush?: boolean;
    /** `div` when this frames other pages' `<article>`s, as a section layout does. */
    as?: "article" | "div";
    class?: ClassValue;
  } = $props();
</script>

<!--
  A page's frame inside a shell. The shell's `<main>` sets no width, so each page picks one here
  rather than every page inheriting the same centred box.
-->
<svelte:element
  this={as}
  class={[
    "mx-auto w-full min-w-0",
    WIDTHS[width],
    flush
      ? "grow"
      : `
        mt-3 mb-12 px-2
        sm:px-3
        md:px-5
      `,
    klass,
  ]}
>
  {@render children()}
</svelte:element>
