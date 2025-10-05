<!-- For when a form field only has one control inside -->

<script
  lang="ts"
  generics="T extends Record<string, unknown>, U extends FormPath<T>"
>
  import type { ComponentProps } from "svelte";
  import type { FormPath } from "sveltekit-superforms";
  import FormControl from "../controls/FormControl.svelte";
  import FormField from "./FormField.svelte";

  let {
    // field
    form,
    name,
    description,

    // control
    label,
    horizontal,

    // input
    children: input,
  }: Omit<ComponentProps<typeof FormField<T, U>>, "children"> &
    ComponentProps<typeof FormControl> = $props();
</script>

<FormField {form} {name} {description}>
  {#snippet children(props)}
    <FormControl {...props} {label} {horizontal}>
      {#snippet children({ props })}
        {@render input?.({ props })}
      {/snippet}
    </FormControl>
  {/snippet}
</FormField>
