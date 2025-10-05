<script lang="ts">
  import { Control } from "$lib/components/ui/form/index.js";
  import type { ComponentProps } from "svelte";
  import LabelWrapper from "../../ui/label/Labeled.svelte";

  let {
    label,
    horizontal = false,
    children: input_children,

    ...control_props
  }: ComponentProps<typeof Control> & {
    label: string;
    horizontal?: boolean;
  } = $props();
</script>

<Control {...control_props}>
  {#snippet children({ props })}
    {#if label}
      <LabelWrapper is_form {label} {horizontal}>
        {@render input_children?.({ props })}
      </LabelWrapper>
    {:else}
      {@render input_children?.({ props })}
    {/if}
  {/snippet}
</Control>
