<script lang="ts">
  import { cn } from "$lib/utils/shadcn.util.js";
  import type { ComponentProps } from "svelte";
  import Separator from "../separator/separator.svelte";

  let {
    ref = $bindable(null),
    class: className,
    orientation = "vertical",
    ...restProps
  }: ComponentProps<typeof Separator> = $props();
</script>

<Separator
  bind:ref
  data-slot="button-group-separator"
  {orientation}
  class={cn(
    "relative !m-0 self-stretch bg-input data-[orientation=vertical]:h-auto",
    className,
  )}
  {...restProps}
/>
