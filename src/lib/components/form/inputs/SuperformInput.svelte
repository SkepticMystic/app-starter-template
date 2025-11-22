<script
  lang="ts"
  module
>
  type T = Record<string, unknown>;
</script>

<script
  lang="ts"
  generics="T extends Record<string, unknown>"
>
  import Input from "$lib/components/ui/input/input.svelte";
  import type { FsSuperForm } from "formsnap";
  import { untrack, type ComponentProps } from "svelte";
  import type { HTMLInputTypeAttribute } from "svelte/elements";
  import {
    formFieldProxy,
    type FormPathLeaves,
    type SuperForm,
  } from "sveltekit-superforms";

  let {
    form,
    name,
    value: _value,
    ...rest
  }: Omit<ComponentProps<typeof Input>, "name" | "form" | "type" | "files"> & {
    type?: Exclude<HTMLInputTypeAttribute, "file">;
    form: SuperForm<T> | FsSuperForm<T>;
    // Not having `| string` would be nice
    // But in practice, we get the `name` prop from the wrapping Control
    // and it doesn't narrow the name type
    // But, the control gets its name prop from the wrapping Field, and we do type that
    name: string | FormPathLeaves<T>;
  } = $props();

  const { value, constraints } = $derived(
    formFieldProxy(
      untrack(() => form as SuperForm<T>),
      name as FormPathLeaves<T>,
    ),
  );
</script>

<!-- NOTE: Default required to $constraints, but allow ...rest to override -->
<Input
  required={$constraints?.required}
  {...rest}
  {name}
  bind:value={$value}
/>
