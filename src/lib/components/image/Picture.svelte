<script lang="ts">
  import { cn } from "$lib/utils/shadcn.util";
  import { Image as Picture, type ImageProps } from "@unpic/svelte";
  import type { ClassValue } from "svelte/elements";
  import Anchor from "../ui/anchor/Anchor.svelte";

  let {
    href,
    image,
    loading,
    fallback,
    class: klass,
    fetchpriority,
    prioritize = false,
    ...props
  }: Omit<ImageProps, "src"> & {
    href?: string;
    fallback?: string;
    src?: string | null;
    prioritize?: boolean;
    class?: ClassValue | null;
    image?: { url: string };
  } = $props();

  // NOTE: ...rest props are readonly,
  // so we destructure them above and pass them down to Picture
  if (prioritize) {
    loading ??= "eager";
    fetchpriority ??= "high";
  }

  const style = [
    props.width ? `width: ${props.width}px` : "",
    props.height ? `height: ${props.height}px` : "",
  ]
    .filter(Boolean)
    .join("; ")
    .trim();
</script>

{#snippet img()}
  {#if image || props.src}
    <Picture
      {style}
      {loading}
      {fetchpriority}
      src={image?.url}
      class={cn("h-full w-full rounded-md", klass)}
      {...props}
    />
  {:else if fallback}
    <div
      {...props}
      class={cn("flex items-center justify-center rounded-md bg-muted", klass)}
    >
      {fallback}
    </div>
  {/if}
{/snippet}

{#if href}
  <Anchor {href}>
    {@render img()}
  </Anchor>
{:else}
  {@render img()}
{/if}
