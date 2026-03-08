<script lang="ts">
  import { Drawer as DrawerPrimitive } from "vaul-svelte";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: DrawerPrimitive.DescriptionProps = $props();
</script>

<DrawerPrimitive.Description
  bind:ref
  data-slot="drawer-description"
  class={["text-sm text-muted-foreground", className]}
  {...restProps}
/>
