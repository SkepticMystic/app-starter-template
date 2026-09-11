<script lang="ts">
  import { RangeCalendar as RangeCalendarPrimitive } from "bits-ui";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import {
    buttonVariants,
    type ButtonVariant,
  } from "$lib/components/ui/button/button.svelte";

  let {
    ref = $bindable(null),
    class: className,
    children,
    variant = "ghost",
    ...restProps
  }: RangeCalendarPrimitive.NextButtonProps & {
    variant?: ButtonVariant;
  } = $props();
</script>

{#snippet Fallback()}
  <Icon
    icon="lucide/chevron-right"
    class={["size-4", className]}
  />
{/snippet}

<RangeCalendarPrimitive.NextButton
  bind:ref
  class={[
    buttonVariants({ variant }),
    "size-(--cell-size) bg-transparent p-0 select-none disabled:opacity-50 rtl:rotate-180",
    className,
  ]}
  {...restProps}
>
  {#if children}
    {@render children?.()}
  {:else}
    {@render Fallback()}
  {/if}
</RangeCalendarPrimitive.NextButton>
