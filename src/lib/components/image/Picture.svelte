<script lang="ts">
  import { cn } from "$lib/utils/shadcn.util";
  import { Image } from "@unpic/svelte/base";
  import type { ClassValue } from "svelte/elements";
  import { transform } from "unpic/providers/cloudinary";
  import Anchor from "../ui/anchor/Anchor.svelte";

  let {
    src,
    href,
    image,
    width,
    height,
    loading,
    fallback,
    class: klass,
    fetchpriority,
    prioritize = false,
  }: {
    src?: string;
    class?: ClassValue;
    loading?: "lazy" | "eager";
    fetchpriority?: "high" | "low";
    width?: number;
    height?: number;
    href?: string;
    fallback?: string;
    prioritize?: boolean;
    image?: { url: string };
  } = $props();

  // NOTE: ...rest props are readonly,
  // so we destructure them above and pass them down to Picture
  if (prioritize) {
    loading ??= "eager";
    fetchpriority ??= "high";
  }

  const style = [
    width ? `width: ${width}px` : "",
    height ? `height: ${height}px` : "",
  ]
    .filter(Boolean)
    .join("; ")
    .trim();
</script>

{#snippet img()}
  {#if image || src}
    <Image
      {style}
      {loading}
      {fetchpriority}
      src={image?.url ?? src}
      transformer={transform}
      class={cn("h-full w-full rounded-md", klass)}
    />
  {:else if fallback}
    <div
      {style}
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
