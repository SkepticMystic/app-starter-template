<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import type { AvatarRootProps } from "bits-ui";

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

<Avatar.Root {...rest}>
  <Avatar.Image
    {src}
    {alt}
  />
  <Avatar.Fallback>{fallback}</Avatar.Fallback>
</Avatar.Root>
