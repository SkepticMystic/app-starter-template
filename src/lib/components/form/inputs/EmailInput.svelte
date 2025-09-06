<script lang="ts">
  import Input from "$lib/components/ui/input/input.svelte";
  import type { ComponentProps } from "svelte";

  let {
    value = $bindable(),
    ...rest
  }: Omit<ComponentProps<typeof Input>, "type" | "value" | "files"> & {
    value?: string;
  } = $props();
</script>

<Input
  required
  type="email"
  autocomplete="email"
  placeholder="Email address"
  {...rest}
  bind:value
/>
