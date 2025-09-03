<script lang="ts">
  import {
    buttonVariants,
    type ButtonProps,
  } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import type { DialogRootProps } from "bits-ui";
  import type { Snippet } from "svelte";

  let {
    title,
    description,
    size = "default",
    variant = "default",

    trigger,
    actions,
    children,
    ...rest_props
  }: DialogRootProps & {
    title?: string;
    description?: string;
    size?: ButtonProps["size"];
    variant?: ButtonProps["variant"];

    trigger: Snippet;
    actions?: Snippet;
  } = $props();
</script>

<Dialog.Root {...rest_props}>
  <Dialog.Trigger {title} class={buttonVariants({ variant, size })}>
    {@render trigger?.()}
  </Dialog.Trigger>

  <Dialog.Content class="sm:max-w-[425px]">
    {#if title || description}
      <Dialog.Header>
        {#if title}
          <Dialog.Title>{title}</Dialog.Title>
        {/if}

        {#if description}
          <Dialog.Description>
            {description}
          </Dialog.Description>
        {/if}
      </Dialog.Header>
    {/if}

    {@render children?.()}

    {#if actions}
      <Dialog.Footer>
        {@render actions?.()}
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
