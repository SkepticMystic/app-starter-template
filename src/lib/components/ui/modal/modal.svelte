<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import {
    buttonVariants,
    type ButtonSize,
    type ButtonVariant,
  } from "../button/button.svelte";
  import Icon from "../icon/Icon.svelte";
  import ModalContent from "./modal-content.svelte";
  import ModalDescription from "./modal-description.svelte";
  import ModalFooter from "./modal-footer.svelte";
  import ModalHeader from "./modal-header.svelte";
  import ModalRoot from "./modal-root.svelte";
  import ModalTitle from "./modal-title.svelte";
  import ModalTrigger from "./modal-trigger.svelte";

  let {
    icon,
    /**
     * `$bindable`, and bound through to `ModalRoot` below, because `close()`
     * writes to it.
     *
     * Passed one-way it went stale the moment the trigger reopened the dialog:
     * bits-ui wrote the reopen into `ModalRoot`'s own copy, this one stayed
     * `false` from the previous close, and assigning `false` over `false` is
     * not a change Svelte propagates — so every `close()` after the first was
     * silently a no-op and the dialog stayed open.
     */
    open = $bindable(false),
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
    icon?: string;
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
  bind:open
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
      <Icon {icon} />
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
