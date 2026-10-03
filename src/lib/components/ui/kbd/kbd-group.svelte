<script lang="ts">
  import { type WithElementRef } from "#lib/utils/shadcn.util.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<kbd
  bind:this={ref}
  data-slot="kbd-group"
  class={["inline-flex items-center gap-1", className]}
  {...restProps}
>
  {@render children?.()}
</kbd>
