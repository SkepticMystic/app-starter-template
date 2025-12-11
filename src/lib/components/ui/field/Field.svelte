<script
  lang="ts"
  generics="V extends RemoteFormFieldValue"
>
  import ExtractSnippet from "$lib/components/util/ExtractSnippet.svelte";
  import type { MaybeSnippet } from "$lib/interfaces/svelte/svelte.types";
  import type { RemoteFormField, RemoteFormFieldValue } from "@sveltejs/kit";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import FieldContent from "./field-content.svelte";
  import FieldDescription from "./field-description.svelte";
  import FieldError from "./field-error.svelte";
  import FieldLabel from "./field-label.svelte";
  import FieldRoot, { type FieldOrientation } from "./field-root.svelte";

  let {
    label,
    field,
    description,
    orientation,
    class: klass,
    input,
  }: {
    label: string;
    class?: ClassValue;
    field?: RemoteFormField<V>;
    description?: MaybeSnippet;
    orientation?: FieldOrientation;
    input: Snippet<
      [
        {
          field: typeof field;
          props: Record<string, unknown>;
        },
      ]
    >;
  } = $props();

  const id = $props.id();

  const issues = $derived(field?.issues());
</script>

<FieldRoot
  {orientation}
  class={[klass]}
  data-invalid={Boolean(issues?.length)}
>
  <FieldContent>
    <FieldLabel for={id}>
      {label}
    </FieldLabel>

    {#if description}
      <FieldDescription>
        <ExtractSnippet snippet={description} />
      </FieldDescription>
    {/if}

    <FieldError errors={issues} />
  </FieldContent>

  {@render input({
    field,
    props: { id },
  })}
</FieldRoot>
