<script lang="ts">
  import * as Collapsible from "$lib/components/ui/collapsible/index.js";
  import { cn } from "$lib/utils/shadcn.util";
  import type { CollapsibleRootProps } from "bits-ui";
  import type { Snippet } from "svelte";

  let {
    open,
    trigger,
    content,
    ...rest
  }: CollapsibleRootProps & {
    trigger: Snippet<[{ open: boolean | undefined }]>;
    content: Snippet;
  } = $props();
</script>

<Collapsible.Root
  {...rest}
  class={cn("rounded-md border px-3 py-2", rest.class)}
  bind:open
>
  <Collapsible.Trigger class="w-full">
    {@render trigger({ open })}
  </Collapsible.Trigger>

  <Collapsible.Content class="mt-5 mb-2">
    {@render content()}
  </Collapsible.Content>
</Collapsible.Root>
