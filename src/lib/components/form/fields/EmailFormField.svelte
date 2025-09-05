<script lang="ts">
  import type { ComponentProps } from "svelte";
  import EmailFormControl from "../controls/EmailFormControl.svelte";
  import FormField from "./FormField.svelte";

  let {
    input,
    control,
    value = $bindable(),
    ...field
  }: Omit<
    ComponentProps<typeof FormField<{ email?: string }, "email">>,
    "name"
  > & {
    value?: string;
    input?: Partial<ComponentProps<typeof EmailFormControl>["input"]>;
    control?: Partial<Omit<ComponentProps<typeof EmailFormControl>, "input">>;
  } = $props();
</script>

<FormField {...field} name="email">
  {#snippet children(props)}
    <EmailFormControl {...props} {...control} {input} bind:value />
  {/snippet}
</FormField>
