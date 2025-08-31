<script lang="ts">
  import { Control } from "$lib/components/ui/form/index.js";
  import type { ComponentProps } from "svelte";
  import LabelWrapper from "../ui/label/Labeled.svelte";

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
  {#snippet children({ props: input_props })}
    <LabelWrapper is_form {label} {horizontal}>
      {@render input_children?.({ props: input_props })}
    </LabelWrapper>
  {/snippet}
</Control>
