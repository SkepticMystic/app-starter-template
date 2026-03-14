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
  data-slot="field-content"
  class={[
    "group/field-content flex flex-1 flex-col gap-1.5 leading-snug",
    className,
  ]}
  {...restProps}
>
  {@render children?.()}
</div>
