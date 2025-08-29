<script lang="ts">
  import { Control, Label } from "$lib/components/ui/form/index.js";
  import type { ComponentProps } from "svelte";

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
    <div
      class={[
        horizontal
          ? "flex flex-row-reverse items-center justify-end gap-2"
          : "flex flex-col gap-2",
      ]}
    >
      <Label>{label}</Label>

      {@render input_children?.({ props: input_props })}
    </div>
  {/snippet}
</Control>
