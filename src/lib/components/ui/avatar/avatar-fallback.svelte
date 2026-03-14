<script lang="ts">
  import { Avatar as AvatarPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: AvatarPrimitive.FallbackProps = $props();
</script>

<AvatarPrimitive.Fallback
  bind:ref
  data-slot="avatar-fallback"
  class={[
    "flex size-full items-center justify-center rounded-full bg-muted",
    className,
  ]}
  {...restProps}
/>
