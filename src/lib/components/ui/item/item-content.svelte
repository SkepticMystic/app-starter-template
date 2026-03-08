<script lang="ts">
  import { type WithElementRef } from "$lib/utils/shadcn.util.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="item-content"
  class={[
    "flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none",
    className,
  ]}
  {...restProps}
>
  {@render children?.()}
</div>
