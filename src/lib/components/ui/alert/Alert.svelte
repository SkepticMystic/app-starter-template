<script lang="ts">
  import ExtractSnippet from "$lib/components/util/ExtractSnippet.svelte";
  import type { MaybeSnippet } from "$lib/interfaces/svelte/svelte.types";
  import type { ComponentProps } from "svelte";
  import AlertDescription from "./alert-description.svelte";
  import AlertRoot from "./alert-root.svelte";
  import AlertTitle from "./alert-title.svelte";

  let {
    title,
    description,
    ...props
  }: Omit<ComponentProps<typeof AlertRoot>, "title"> & {
    title: MaybeSnippet;
    description: MaybeSnippet;
  } = $props();
</script>

<AlertRoot {...props}>
  <AlertTitle>
    <ExtractSnippet snippet={title} />
  </AlertTitle>

  <AlertDescription>
    <ExtractSnippet snippet={description} />
  </AlertDescription>
</AlertRoot>
