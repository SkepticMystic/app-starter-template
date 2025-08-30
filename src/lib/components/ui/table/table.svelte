<script lang="ts">
  import type { HTMLTableAttributes } from "svelte/elements";
  import { cn, type WithElementRef } from "$lib/utils/shadcn.util.js";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLTableAttributes> = $props();
</script>

<div
  data-slot="table-container"
  class="relative w-full overflow-x-auto rounded border shadow"
>
  <table
    bind:this={ref}
    data-slot="table"
    class={cn("w-full text-sm", className)}
    {...restProps}
  >
    {@render children?.()}
  </table>
</div>
