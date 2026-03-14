<script lang="ts">
  import { type WithElementRef } from "$lib/utils/shadcn.util";
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
  data-slot="drawer-footer"
  class={["mt-auto flex flex-col gap-2", className]}
  {...restProps}
>
  {@render children?.()}
</div>
