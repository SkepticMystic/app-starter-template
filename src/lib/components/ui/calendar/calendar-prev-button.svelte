<script lang="ts">
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import {
    buttonVariants,
    type ButtonVariant,
  } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils/shadcn.util.js";
  import { Calendar as CalendarPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    class: className,
    children,
    variant = "ghost",
    ...restProps
  }: CalendarPrimitive.PrevButtonProps & {
    variant?: ButtonVariant;
  } = $props();
</script>

{#snippet Fallback()}
  <Icon
    icon="lucide/chevron-left"
    class="size-4"
  />
{/snippet}

<CalendarPrimitive.PrevButton
  bind:ref
  children={children || Fallback}
  class={cn(
    buttonVariants({ variant }),
    "size-(--cell-size) bg-transparent p-0 select-none disabled:opacity-50 rtl:rotate-180",
    className,
  )}
  {...restProps}
/>
