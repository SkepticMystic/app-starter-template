<script lang="ts">
  import { type WithElementRef } from "#lib/utils/shadcn.util.js";
  import type { HTMLLiAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLLiAttributes> = $props();
</script>

<li
  bind:this={ref}
  data-slot="breadcrumb-item"
  class={["inline-flex items-center gap-1", className]}
  {...restProps}
>
  {@render children?.()}
</li>
