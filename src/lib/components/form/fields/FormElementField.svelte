<script
  lang="ts"
  generics="T extends Record<string, unknown>, U extends FormPathLeaves<T>"
>
  import FormElementField from "$lib/components/ui/form/form-element-field.svelte";
  import type { ComponentProps } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import type { FormPathLeaves } from "sveltekit-superforms";
  import { FieldErrors } from "../../ui/form";

  let {
    form,
    name,
    class: klass,
    children: control_children,
  }: ComponentProps<typeof FormElementField<T, U>> & {
    class?: ClassValue;
  } = $props();
</script>

<FormElementField
  {form}
  {name}
  class={klass}
>
  {#snippet children(control_props)}
    {@render control_children?.(control_props)}

    <FieldErrors />
  {/snippet}
</FormElementField>
