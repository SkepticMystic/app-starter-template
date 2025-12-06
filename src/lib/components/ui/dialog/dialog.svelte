<script lang="ts">
  import type { DialogRootProps } from "bits-ui";
  import type { Snippet } from "svelte";
  import {
    buttonVariants,
    type ButtonSize,
    type ButtonVariant,
  } from "../button/button.svelte";
  import DialogContent from "./dialog-content.svelte";
  import DialogDescription from "./dialog-description.svelte";
  import DialogFooter from "./dialog-footer.svelte";
  import DialogHeader from "./dialog-header.svelte";
  import DialogRoot from "./dialog-root.svelte";
  import DialogTitle from "./dialog-title.svelte";
  import DialogTrigger from "./dialog-trigger.svelte";

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

<DialogRoot
  {...rest_props}
  {open}
>
  {#if trigger_child}
    <DialogTrigger>
      {#snippet child({ props })}
        {@render trigger_child({ props })}
      {/snippet}
    </DialogTrigger>
  {:else}
    <DialogTrigger
      {title}
      class={buttonVariants({ variant, size })}
    >
      {@render trigger?.()}
    </DialogTrigger>
  {/if}

  <DialogContent class="sm:max-w-[425px]">
    {#if title || description}
      <DialogHeader>
        {#if title}
          <DialogTitle>{title}</DialogTitle>
        {/if}

        {#if description}
          <DialogDescription>
            {description}
          </DialogDescription>
        {/if}
      </DialogHeader>
    {/if}

    {@render content({ close })}

    {#if actions}
      <DialogFooter>
        {@render actions?.()}
      </DialogFooter>
    {/if}
  </DialogContent>
</DialogRoot>
