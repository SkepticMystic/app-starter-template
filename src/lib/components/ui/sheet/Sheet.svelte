<script lang="ts">
  import ExtractSnippet from "$lib/components/util/ExtractSnippet.svelte";
  import type { MaybeSnippet } from "$lib/interfaces/svelte/svelte.type";
  import type { Snippet } from "svelte";
  import {
    buttonVariants,
    type ButtonSize,
    type ButtonVariant,
  } from "../button/button.svelte";
  import Icon from "../icon/Icon.svelte";
  import SheetContent, { type Side } from "./sheet-content.svelte";
  import SheetDescription from "./sheet-description.svelte";
  import SheetFooter from "./sheet-footer.svelte";
  import SheetHeader from "./sheet-header.svelte";
  import SheetRoot from "./sheet-root.svelte";
  import SheetTitle from "./sheet-title.svelte";
  import SheetTrigger from "./sheet-trigger.svelte";

  let {
    icon,
    size,
    variant,

    open = $bindable(false),
    trigger,

    side,
    title,
    description,

    children,

    footer,
  }: {
    icon?: string;
    size?: ButtonSize;
    variant?: ButtonVariant;

    open?: boolean;
    trigger?: MaybeSnippet;

    side?: Side;
    title?: MaybeSnippet;
    description?: MaybeSnippet;

    children?: Snippet<[{ close: () => void }]>;
    footer?: Snippet;
  } = $props();

  const close = () => {
    open = false;
  };
</script>

<SheetRoot bind:open>
  <SheetTrigger class={buttonVariants({ variant, size })}>
    <Icon {icon} />
    <ExtractSnippet snippet={trigger ?? title} />
  </SheetTrigger>

  <SheetContent {side}>
    <SheetHeader>
      {#if title}
        <SheetTitle>
          <ExtractSnippet snippet={title} />
        </SheetTitle>
      {/if}

      {#if description}
        <SheetDescription>
          <ExtractSnippet snippet={description} />
        </SheetDescription>
      {/if}
    </SheetHeader>

    <div class="px-4">
      {@render children?.({ close })}
    </div>

    {#if footer}
      <SheetFooter>
        {@render footer()}
      </SheetFooter>
    {/if}
  </SheetContent>
</SheetRoot>
