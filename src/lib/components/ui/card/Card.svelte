<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import CardContent from "./card-content.svelte";
  import CardDescription from "./card-description.svelte";
  import CardFooter from "./card-footer.svelte";
  import CardHeader from "./card-header.svelte";
  import CardRoot from "./card-root.svelte";
  import CardTitle from "./card-title.svelte";

  let {
    title,
    description,
    class: klass,

    content,
    actions,
  }: {
    title?: string;
    description?: string;
    class?: ClassValue;

    content: Snippet;
    actions?: Snippet;
  } = $props();
</script>

<CardRoot class={klass}>
  {#if title || description}
    <CardHeader>
      {#if title}
        <CardTitle>{title}</CardTitle>
      {/if}

      {#if description}
        <CardDescription>{description}</CardDescription>
      {/if}
    </CardHeader>
  {/if}

  <CardContent>
    {@render content()}
  </CardContent>

  {#if actions}
    <CardFooter>
      {@render actions?.()}
    </CardFooter>
  {/if}
</CardRoot>
