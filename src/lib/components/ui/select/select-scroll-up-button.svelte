<script lang="ts">
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import { cn, type WithoutChildrenOrChild } from "$lib/utils/shadcn.util.js";
  import { Select as SelectPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<SelectPrimitive.ScrollUpButtonProps> = $props();
</script>

<SelectPrimitive.ScrollUpButton
  bind:ref
  data-slot="select-scroll-up-button"
  class={cn("flex cursor-default items-center justify-center py-1", className)}
  {...restProps}
>
  <Icon
    icon="lucide/chevron-up"
    class="size-4"
  />
</SelectPrimitive.ScrollUpButton>
