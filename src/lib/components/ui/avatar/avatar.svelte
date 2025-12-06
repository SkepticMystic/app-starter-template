<script lang="ts">
  import type { AvatarRootProps } from "bits-ui";
  import AvatarFallback from "./avatar-fallback.svelte";
  import AvatarImage from "./avatar-image.svelte";
  import AvatarRoot from "./avatar-root.svelte";

  let {
    src,
    fallback,
    alt = "Avatar",

    ...rest
  }: AvatarRootProps & {
    src?: string | null;
    alt?: string;
    fallback?: string;
  } = $props();
</script>

<AvatarRoot {...rest}>
  <AvatarImage
    {src}
    {alt}
  />
  <AvatarFallback>{fallback}</AvatarFallback>
</AvatarRoot>
