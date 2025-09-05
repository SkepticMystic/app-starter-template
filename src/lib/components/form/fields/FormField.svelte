<script
  lang="ts"
  generics="T extends Record<string, unknown>, U extends FormPath<T>"
>
  import type { FieldProps } from "formsnap";
  import type { ClassValue } from "svelte/elements";
  import type { FormPath } from "sveltekit-superforms";
  import { Description, Field, FieldErrors } from "../../ui/form";

  let {
    form,
    name,
    description,
    class: klass,
    children: control_children,
  }: FieldProps<T, U> & {
    class?: ClassValue;
    description?: string;
  } = $props();
</script>

<Field {form} {name} class={klass}>
  {#snippet children(control_props)}
    {@render control_children?.(control_props)}

    {#if description}
      <Description>{description}</Description>
    {/if}

    <FieldErrors />
  {/snippet}
</Field>
