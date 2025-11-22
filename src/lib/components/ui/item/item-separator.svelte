<script lang="ts">
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { cn } from "$lib/utils/shadcn.util.js";
  import type { ComponentProps } from "svelte";

  let { class: className, ...restProps }: ComponentProps<typeof Separator> =
    $props();
</script>

<Separator
  data-slot="item-separator"
  orientation="horizontal"
  class={cn("my-0", className)}
  {...restProps}
/>
