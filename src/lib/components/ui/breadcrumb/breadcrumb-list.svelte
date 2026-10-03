<script lang="ts">
  import { type WithElementRef } from "#lib/utils/shadcn.util.js";
  import type { HTMLOlAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLOlAttributes> = $props();
</script>

<ol
  bind:this={ref}
  data-slot="breadcrumb-list"
  class={[
    "flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground",
    className,
  ]}
  {...restProps}
>
  {@render children?.()}
</ol>
