<script lang="ts">
  import type { AvatarRootProps } from "bits-ui";
  import AvatarFallback from "./avatar-fallback.svelte";
  import AvatarImage from "./avatar-image.svelte";
  import AvatarRoot from "./avatar-root.svelte";

  /** The rendered width, in px. */
  type AvatarSize = 24 | 32 | 40 | 48 | 56 | 64;

  /**
   * `!`, because `avatar-root.svelte` keeps upstream's `size-8`. There is no class merge, and
   * Tailwind emits `size-*` in numeric order, so the larger of the two always won: a 24 drew at
   * 32, and a caller's `class="size-8"` lost to the default 48. Size an avatar with `size`.
   */
  const SIZES: Record<AvatarSize, string> = {
    24: "size-6!",
    32: "size-8!",
    40: "size-10!",
    48: "size-12!",
    56: "size-14!",
    64: "size-16!",
  };

  let {
    src,
    fallback,
    alt = "Avatar",
    size = 48,
    class: klass,

    ...rest
  }: Omit<AvatarRootProps, "class"> & {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: AvatarSize;
    class?: AvatarRootProps["class"];
  } = $props();
</script>

<AvatarRoot
  class={[SIZES[size], klass]}
  {...rest}
>
  <AvatarImage
    {src}
    {alt}
  />
  <AvatarFallback>{fallback}</AvatarFallback>
</AvatarRoot>
