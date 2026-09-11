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

<div
  {...restProps}
  bind:this={ref}
  class={["flex flex-col", className]}
>
  {@render children?.()}
</div>
