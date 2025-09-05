<script lang="ts">
  import type { ComponentProps } from "svelte";
  import EmailInput from "../inputs/EmailInput.svelte";
  import FormControl from "./FormControl.svelte";

  let {
    input,
    value = $bindable(),
    ...control
  }: Partial<ComponentProps<typeof FormControl>> & {
    value?: string;
    input?: Partial<ComponentProps<typeof EmailInput>>;
  } = $props();
</script>

<FormControl label="Email" {...control}>
  {#snippet children({ props })}
    <EmailInput {...props} {...input} bind:value />
  {/snippet}
</FormControl>
