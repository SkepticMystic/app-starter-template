<script lang="ts">
  import ExtractSnippet from "$lib/components/util/ExtractSnippet.svelte";
  import type { MaybeSnippet } from "$lib/interfaces/svelte/svelte.types";
  import type { ComponentProps } from "svelte";
  import FieldDescription from "./field-description.svelte";
  import FieldLegend from "./field-legend.svelte";
  import FieldSet from "./field-set.svelte";

  let {
    legend,
    description,
    children,
    ...rest
  }: {
    legend?: MaybeSnippet;
    description?: MaybeSnippet;
  } & ComponentProps<typeof FieldSet> = $props();
</script>

<FieldSet {...rest}>
  {#if legend}
    <FieldLegend>
      <ExtractSnippet snippet={legend} />
    </FieldLegend>
  {/if}

  {#if description}
    <FieldDescription>
      <ExtractSnippet snippet={description} />
    </FieldDescription>
  {/if}

  {@render children?.()}
</FieldSet>
