<script lang="ts">
  import * as Popover from "$lib/components/ui/popover/index.js";
  import type { Snippet } from "svelte";
  import {
    buttonVariants,
    type ButtonSize,
    type ButtonVariant,
  } from "../button";

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

<Popover.Root>
  <Popover.Trigger class={buttonVariants({ size, variant })}>
    {@render trigger()}
  </Popover.Trigger>

  <Popover.Content>
    {@render content()}
  </Popover.Content>
</Popover.Root>
