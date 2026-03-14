<script lang="ts">
  import type { ComponentProps } from "svelte";
  import Separator from "../separator/separator.svelte";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: ComponentProps<typeof Separator> = $props();
</script>

<Separator
  bind:ref
  data-slot="sidebar-separator"
  data-sidebar="separator"
  class={["bg-sidebar-border", className]}
  {...restProps}
/>
