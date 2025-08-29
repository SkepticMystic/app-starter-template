<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

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

<Card.Root class={klass}>
  {#if title || description}
    <Card.Header>
      {#if title}
        <Card.Title>{title}</Card.Title>
      {/if}

      {#if description}
        <Card.Description>{description}</Card.Description>
      {/if}
    </Card.Header>
  {/if}

  <Card.Content>
    {@render content()}
  </Card.Content>

  {#if actions}
    <Card.Footer>
      {@render actions?.()}
    </Card.Footer>
  {/if}
</Card.Root>
