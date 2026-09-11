<script lang="ts">
  import { type WithElementRef } from "$lib/utils/shadcn.util.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<nav
  {...restProps}
  bind:this={ref}
  class={[
    "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
    className,
  ]}
>
  {@render children?.()}
</nav>
