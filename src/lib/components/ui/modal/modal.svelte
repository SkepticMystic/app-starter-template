<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import {
    buttonVariants,
    type ButtonSize,
    type ButtonVariant,
  } from "../button/button.svelte";
  import ModalContent from "./modal-content.svelte";
  import ModalDescription from "./modal-description.svelte";
  import ModalFooter from "./modal-footer.svelte";
  import ModalHeader from "./modal-header.svelte";
  import ModalRoot from "./modal-root.svelte";
  import ModalTitle from "./modal-title.svelte";
  import ModalTrigger from "./modal-trigger.svelte";

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
  }: ComponentProps<typeof ModalRoot> & {
    title?: string;
    description?: string;
    size?: ButtonSize;
    variant?: ButtonVariant;

    trigger?: Snippet;
    trigger_child?: Snippet<[{ props: Record<string, unknown> }]>;
    content: Snippet<[{ close: typeof close }]>;
    actions?: Snippet;
  } = $props();

  const close = () => {
    open = false;
  };
</script>

<ModalRoot
  {...rest_props}
  {open}
>
  {#if trigger_child}
    <ModalTrigger>
      {#snippet child({ props })}
        {@render trigger_child({ props })}
      {/snippet}
    </ModalTrigger>
  {:else}
    <ModalTrigger
      {title}
      class={buttonVariants({ variant, size })}
    >
      {@render trigger?.()}
    </ModalTrigger>
  {/if}

  <ModalContent class="sm:max-w-[425px]">
    {#if title || description}
      <ModalHeader>
        {#if title}
          <ModalTitle>{title}</ModalTitle>
        {/if}

        {#if description}
          <ModalDescription>
            {description}
          </ModalDescription>
        {/if}
      </ModalHeader>
    {/if}

    {@render content({ close })}

    {#if actions}
      <ModalFooter>
        {@render actions?.()}
      </ModalFooter>
    {/if}
  </ModalContent>
</ModalRoot>
