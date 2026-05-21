<script lang="ts">
  import type { AvatarRootProps } from "bits-ui";
  import AvatarFallback from "./avatar-fallback.svelte";
  import AvatarImage from "./avatar-image.svelte";
  import AvatarRoot from "./avatar-root.svelte";

  type AvatarSize = "xs" | "sm" | "md" | "lg";

  const SIZES: Record<AvatarSize, { px: number; cls: string }> = {
    xs: { px: 24, cls: "size-6" },
    sm: { px: 40, cls: "size-10" },
    md: { px: 48, cls: "size-12" },
    lg: { px: 64, cls: "size-16" },
  };

  let {
    src,
    fallback,
    alt = "Avatar",
    size = "md",
    class: klass,

    ...rest
  }: Omit<AvatarRootProps, "class"> & {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: AvatarSize;
    class?: AvatarRootProps["class"];
  } = $props();

  const tier = $derived(SIZES[size]);
</script>

<AvatarRoot
  class={[tier.cls, klass]}
  {...rest}
>
  <AvatarImage
    {src}
    {alt}
  />
  <AvatarFallback>{fallback}</AvatarFallback>
</AvatarRoot>
