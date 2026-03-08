<script lang="ts">
  import { Avatar as AvatarPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: AvatarPrimitive.ImageProps = $props();
</script>

<AvatarPrimitive.Image
  bind:ref
  data-slot="avatar-image"
  class={["aspect-square size-full", className]}
  {...restProps}
/>
