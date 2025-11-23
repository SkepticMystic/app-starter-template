<script
  lang="ts"
  generics="V extends RemoteFormFieldValue"
>
  import ExtractSnippet from "$lib/components/util/ExtractSnippet.svelte";
  import type { MaybeSnippet } from "$lib/interfaces/svelte/svelte.types";
  import type { RemoteFormField, RemoteFormFieldValue } from "@sveltejs/kit";
  import { boolAttr } from "runed";
  import type { Snippet } from "svelte";
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
    input,
  }: {
    label: string;
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

  const issue = $derived(field?.issues()?.at(0));
</script>

<FieldRoot
  {orientation}
  data-invalid={boolAttr(issue)}
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

    {#if issue}
      <FieldError>
        {issue.message}
      </FieldError>
    {/if}
  </FieldContent>

  {@render input({
    field,
    props: { id, "aria-invalid": boolAttr(issue) },
  })}
</FieldRoot>
