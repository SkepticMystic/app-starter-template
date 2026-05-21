<script lang="ts">
  import { ImageClient } from "$lib/clients/image.client";
  import type { Image as ImageModel } from "$lib/server/db/models/image.model";
  import { Image } from "@unpic/svelte";
  import type { ClassValue } from "svelte/elements";
  import Anchor from "../ui/anchor/Anchor.svelte";

  const BREAKPOINTS = [640, 750, 828, 960, 1080, 1280];

  let {
    src,
    alt,
    href,
    image,
    width,
    height,
    fallback,
    layout,
    loading,
    class: klass,
    priority = false,
  }: {
    alt: string;
    src?: string;
    image?: Pick<ImageModel, "url" | "thumbhash">;
    fallback?: string;
    href?: string;
    width?: number;
    height?: number;
    layout?: "fixed" | "constrained";
    loading?: "lazy" | "eager";
    priority?: boolean;
    class?: ClassValue;
  } = $props();

  const resolved_layout = $derived(
    layout ?? (width && width <= 96 ? "fixed" : "constrained"),
  );
  const resolved_src = $derived(image?.url ?? src);
  const thumbhash_url = $derived(ImageClient.decode_thumbhash(image));
</script>

{#snippet img()}
  {#if resolved_src}
    <Image
      {alt}
      {width}
      {height}
      {priority}
      {loading}
      src={resolved_src}
      layout={resolved_layout}
      breakpoints={BREAKPOINTS}
      background={thumbhash_url}
      operations={{
        cloudinary: { q: "auto", f: "auto", c: "auto", g: "auto" },
      }}
      class={["rounded-md", klass]}
    />
  {:else if fallback}
    <div
      class={["flex items-center justify-center rounded-md bg-muted", klass]}
      style:width={width ? `${width}px` : undefined}
      style:height={height ? `${height}px` : undefined}
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
