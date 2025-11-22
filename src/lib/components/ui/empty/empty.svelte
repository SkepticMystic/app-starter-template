<script
  lang="ts"
  module
>
  import type { ComponentProps, Snippet } from "svelte";

  export type EmptyProps = ComponentProps<typeof EmptyRoot> & {
    media?: Snippet;
    icon?: string;
    loading?: boolean;
    title?: MaybeSnippet;
    content?: MaybeSnippet;
    description?: MaybeSnippet;
  };
</script>

<script lang="ts">
  import ExtractSnippet from "$lib/components/util/ExtractSnippet.svelte";
  import type { MaybeSnippet } from "$lib/interfaces/svelte/svelte.types";
  import Icon from "../icon/Icon.svelte";
  import Spinner from "../spinner/spinner.svelte";
  import EmptyContent from "./empty-content.svelte";
  import EmptyDescription from "./empty-description.svelte";
  import EmptyHeader from "./empty-header.svelte";
  import EmptyMedia from "./empty-media.svelte";
  import EmptyRoot from "./empty-root.svelte";
  import EmptyTitle from "./empty-title.svelte";

  let {
    icon,
    title,
    media,
    content,
    description,
    loading,
    ...props
  }: EmptyProps = $props();
</script>

<EmptyRoot {...props}>
  <EmptyHeader>
    {#if loading}
      <EmptyMedia variant="icon">
        <Spinner />
      </EmptyMedia>
    {:else if media}
      <EmptyMedia>
        {@render media()}
      </EmptyMedia>
    {:else if icon}
      <EmptyMedia variant="icon">
        <Icon {icon} />
      </EmptyMedia>
    {/if}

    {#if loading}
      <EmptyTitle>Loading...</EmptyTitle>
    {:else if title}
      <EmptyTitle>
        <ExtractSnippet snippet={title} />
      </EmptyTitle>
    {/if}

    {#if !loading && description}
      <EmptyDescription>
        <ExtractSnippet snippet={description} />
      </EmptyDescription>
    {/if}
  </EmptyHeader>

  {#if content}
    <EmptyContent>
      <ExtractSnippet snippet={content} />
    </EmptyContent>
  {/if}
</EmptyRoot>
