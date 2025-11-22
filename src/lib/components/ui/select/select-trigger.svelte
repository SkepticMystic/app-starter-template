<script lang="ts">
  import Loading from "$lib/components/ui/loading/Loading.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import { cn, type WithoutChild } from "$lib/utils/shadcn.util.js";
  import { Select as SelectPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    class: className,
    children,
    size = "default",
    loading,
    ...restProps
  }: WithoutChild<SelectPrimitive.TriggerProps> & {
    size?: "sm" | "default";
    loading?: boolean;
  } = $props();
</script>

<SelectPrimitive.Trigger
  bind:ref
  data-slot="select-trigger"
  data-size={size}
  class={cn(
    "flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
    className,
  )}
  {...restProps}
>
  {@render children?.()}

  <Loading
    {loading}
    class="size-4 opacity-50"
  >
    <Icon
      icon="lucide/chevron-down"
      class="size-4 opacity-50"
    />
  </Loading>
</SelectPrimitive.Trigger>
