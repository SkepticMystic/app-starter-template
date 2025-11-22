<script lang="ts">
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import { cn, type WithoutChildrenOrChild } from "$lib/utils/shadcn.util.js";
  import { Select as SelectPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<SelectPrimitive.ScrollDownButtonProps> = $props();
</script>

<SelectPrimitive.ScrollDownButton
  bind:ref
  data-slot="select-scroll-down-button"
  class={cn("flex cursor-default items-center justify-center py-1", className)}
  {...restProps}
>
  <Icon
    icon="lucide/chevron-down"
    class="size-4"
  />
</SelectPrimitive.ScrollDownButton>
