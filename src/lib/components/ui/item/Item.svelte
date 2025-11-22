<script lang="ts">
  import ExtractSnippet from "$lib/components/util/ExtractSnippet.svelte";
  import type { MaybeSnippet } from "$lib/interfaces/svelte/svelte.types";
  import type { ComponentProps, Snippet } from "svelte";
  import Icon from "../icon/Icon.svelte";
  import ItemActions from "./item-actions.svelte";
  import ItemContent from "./item-content.svelte";
  import ItemDescription from "./item-description.svelte";
  import ItemFooter from "./item-footer.svelte";
  import ItemHeader from "./item-header.svelte";
  import ItemMedia from "./item-media.svelte";
  import ItemRoot from "./item-root.svelte";
  import ItemTitle from "./item-title.svelte";

  let {
    icon,
    header,
    media,
    title,
    description,
    footer,
    actions,
    children,
    ...rest
  }: Omit<ComponentProps<typeof ItemRoot>, "title"> & {
    icon?: string;
    media?: Snippet;
    header?: MaybeSnippet;
    title?: MaybeSnippet;
    description?: MaybeSnippet;
    footer?: MaybeSnippet;
    actions?: Snippet;
  } = $props();
</script>

<ItemRoot {...rest}>
  {#if header}
    <ItemHeader>
      <ExtractSnippet snippet={header} />
    </ItemHeader>
  {/if}

  {#if icon}
    <ItemMedia variant="icon">
      <Icon {icon} />
    </ItemMedia>
  {:else if media}
    <ItemMedia>{@render media()}</ItemMedia>
  {/if}

  <ItemContent>
    {#if title}
      <ItemTitle>
        <ExtractSnippet snippet={title} />
      </ItemTitle>
    {/if}

    {#if description}
      <ItemDescription class="text-left">
        <ExtractSnippet snippet={description} />
      </ItemDescription>
    {/if}

    {@render children?.()}
  </ItemContent>

  {#if actions}
    <ItemActions>
      {@render actions()}
    </ItemActions>
  {/if}

  {#if footer}
    <ItemFooter>
      <ExtractSnippet snippet={footer} />
    </ItemFooter>
  {/if}
</ItemRoot>
