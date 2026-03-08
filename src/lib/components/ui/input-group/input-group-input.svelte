<script lang="ts">
  import type { ComponentProps } from "svelte";
  import InputRoot from "../input/input-root.svelte";

  let {
    ref = $bindable(null),
    value = $bindable(),
    class: className,
    ...props
  }: ComponentProps<typeof InputRoot> = $props();
</script>

<InputRoot
  bind:ref
  data-slot="input-group-control"
  class={[
    "flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
    className,
  ]}
  bind:value
  {...props}
/>
