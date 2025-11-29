<script lang="ts">
  import {
    buttonVariants,
    type ButtonProps,
  } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import type { DialogRootProps } from "bits-ui";
  import type { Snippet } from "svelte";

  let {
    open,
    title,
    description,
    size = "default",
    variant = "default",

    actions,
    content,
    trigger,
    trigger_child,

    ...rest_props
  }: DialogRootProps & {
    title?: string;
    description?: string;
    size?: ButtonProps["size"];
    variant?: ButtonProps["variant"];

    trigger?: Snippet;
    trigger_child?: Snippet<[{ props: Record<string, unknown> }]>;
    content: Snippet<[{ close: typeof close }]>;
    actions?: Snippet;
  } = $props();

  const close = () => {
    open = false;
  };
</script>

<Dialog.Root
  {...rest_props}
  {open}
>
  {#if trigger_child}
    <Dialog.Trigger>
      {#snippet child({ props })}
        {@render trigger_child({ props })}
      {/snippet}
    </Dialog.Trigger>
  {:else}
    <Dialog.Trigger
      {title}
      class={buttonVariants({ variant, size })}
    >
      {@render trigger?.()}
    </Dialog.Trigger>
  {/if}

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

    {@render content({ close })}

    {#if actions}
      <Dialog.Footer>
        {@render actions?.()}
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
