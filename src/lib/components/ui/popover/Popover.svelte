<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    buttonVariants,
    type ButtonSize,
    type ButtonVariant,
  } from "../button/button.svelte";
  import PopoverContent from "./popover-content.svelte";
  import PopoverRoot from "./popover-root.svelte";
  import PopoverTrigger from "./popover-trigger.svelte";

  let {
    size,
    variant,

    trigger,
    content,
  }: {
    size?: ButtonSize;
    variant?: ButtonVariant;

    trigger: Snippet;
    content: Snippet;
  } = $props();
</script>

<PopoverRoot>
  <PopoverTrigger class={buttonVariants({ size, variant })}>
    {@render trigger()}
  </PopoverTrigger>

  <PopoverContent>
    {@render content()}
  </PopoverContent>
</PopoverRoot>
