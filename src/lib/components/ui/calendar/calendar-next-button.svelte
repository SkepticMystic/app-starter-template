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
  }: CalendarPrimitive.NextButtonProps & {
    variant?: ButtonVariant;
  } = $props();
</script>

{#snippet Fallback()}
  <Icon icon="lucide/chevron-right" class="size-4" />
{/snippet}

<CalendarPrimitive.NextButton
  bind:ref
  class={cn(
    buttonVariants({ variant }),
    "size-(--cell-size) bg-transparent p-0 select-none disabled:opacity-50 rtl:rotate-180",
    className,
  )}
  children={children || Fallback}
  {...restProps}
/>
