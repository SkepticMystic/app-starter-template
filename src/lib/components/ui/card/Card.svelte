<script lang="ts">
  import ExtractSnippet from "#lib/components/util/ExtractSnippet.svelte";
  import type { MaybeSnippet } from "#lib/interfaces/svelte/svelte.type.js";
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
    children,
    header,
    action,
    footer,
    description,
    heading,
    class: klass,
  }: {
    /** Render `title` as this heading — `h1` when the card is the whole page. */
    heading?: "h1" | "h2" | "h3";
    header?: Snippet;
    class?: ClassValue;
    title?: MaybeSnippet;
    description?: MaybeSnippet;
    action?: Snippet;
    children: MaybeSnippet;
    footer?: Snippet;
  } = $props();
</script>

<CardRoot class={klass}>
  {#if header}
    <CardHeader>
      {@render header()}
    </CardHeader>
  {/if}

  {#if title || description || action}
    <CardHeader>
      {#if title}
        <CardTitle {heading}>
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
    <ExtractSnippet snippet={children} />
  </CardContent>

  {#if footer}
    <CardFooter>
      {@render footer()}
    </CardFooter>
  {/if}
</CardRoot>
