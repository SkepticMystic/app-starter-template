<script lang="ts">
  import ExtractSnippet from "#lib/components/util/ExtractSnippet.svelte";
  import type { MaybeSnippet } from "#lib/interfaces/svelte/svelte.type.js";
  import type { ComponentProps } from "svelte";
  import Button from "../button/button.svelte";
  import Icon from "../icon/Icon.svelte";
  import AlertDescription from "./alert-description.svelte";
  import AlertRoot from "./alert-root.svelte";
  import AlertTitle from "./alert-title.svelte";

  let {
    icon,
    title,
    description,
    on_dismiss,
    ...props
  }: Omit<ComponentProps<typeof AlertRoot>, "title"> & {
    icon?: string;
    title: MaybeSnippet;
    description: MaybeSnippet;
    /** Adds a Dismiss button under the description. */
    on_dismiss?: () => void;
  } = $props();
</script>

<AlertRoot {...props}>
  <AlertTitle>
    <Icon {icon} />
    <ExtractSnippet snippet={title} />
  </AlertTitle>

  <AlertDescription>
    <ExtractSnippet snippet={description} />

    {#if on_dismiss}
      <Button
        variant="outline"
        size="sm"
        class="mt-1"
        onclick={on_dismiss}
      >
        Dismiss
      </Button>
    {/if}
  </AlertDescription>
</AlertRoot>
