<script lang="ts">
  import ExtractSnippet from "$lib/components/util/ExtractSnippet.svelte";
  import type { MaybeSnippet } from "$lib/interfaces/svelte/svelte.type";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import CardAction from "./card-action.svelte";
  import CardContent from "./card-content.svelte";
  import CardDescription from "./card-description.svelte";
  import CardFooter from "./card-footer.svelte";
  import CardHeader from "./card-header.svelte";
  import CardRoot from "./card-root.svelte";
  import CardTitle from "./card-title.svelte";

  let {
    title,
    content,
    header,
    action,
    footer,
    description,
    class: klass,
  }: {
    header?: Snippet;
    class?: ClassValue;
    title?: MaybeSnippet;
    description?: MaybeSnippet;
    action?: Snippet;
    content: MaybeSnippet;
    footer?: Snippet;
  } = $props();
</script>

<CardRoot class={klass}>
  {#if header}
    <CardHeader>
      {@render header()}
    </CardHeader>
  {:else if title || description || action}
    <CardHeader>
      {#if title}
        <CardTitle>
          <ExtractSnippet snippet={title} />
        </CardTitle>
      {/if}

      {#if description}
        <CardDescription>
          <ExtractSnippet snippet={description} />
        </CardDescription>
      {/if}

      {#if action}
        <CardAction>
          {@render action()}
        </CardAction>
      {/if}
    </CardHeader>
  {/if}

  <CardContent>
    <ExtractSnippet snippet={content} />
  </CardContent>

  {#if footer}
    <CardFooter>
      {@render footer()}
    </CardFooter>
  {/if}
</CardRoot>
