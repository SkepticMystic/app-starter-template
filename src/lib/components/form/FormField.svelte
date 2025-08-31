<script lang="ts" module>
  import type { FormPath } from "sveltekit-superforms";

  // the form object
  type T = Record<string, unknown>;
  // the path/name of the field in the form object
  type U = unknown;
</script>

<script
  lang="ts"
  generics="T extends Record<string, unknown>, U extends FormPath<T>"
>
  import { Description, Field, FieldErrors, type FieldProps } from "formsnap";

  let {
    form,
    name,
    description,
    children: control_children,
  }: FieldProps<T, U> & {
    description?: string;
  } = $props();
</script>

<Field {form} {name}>
  {#snippet children(control_props)}
    {@render control_children?.(control_props)}

    {#if description}
      <Description>{description}</Description>
    {/if}

    <FieldErrors />
  {/snippet}
</Field>
