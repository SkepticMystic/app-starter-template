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
  data-slot="item-separator"
  orientation="horizontal"
  class={["my-0", className]}
  {...restProps}
/>
