<script lang="ts">
  import { cn } from "$lib/utils/shadcn.util.js";
  import { Calendar as CalendarPrimitive } from "bits-ui";
  import { buttonVariants, type ButtonVariant } from "../button/button.svelte";
  import Icon from "../icon/Icon.svelte";

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
  class={cn(
    buttonVariants({ variant }),
    "size-(--cell-size) bg-transparent p-0 select-none disabled:opacity-50 rtl:rotate-180",
    className,
  )}
  children={children || Fallback}
  {...restProps}
/>
