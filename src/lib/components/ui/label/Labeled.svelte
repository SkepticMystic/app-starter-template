<script lang="ts">
  import type { LabelProps } from "formsnap";
  import Label from "./label.svelte";
  import FormLabel from "../form/form-label.svelte";

  let {
    label,
    horizontal,
    is_form = false,
    children,

    ...rest_props
  }: LabelProps & {
    label: string;
    is_form?: boolean;
    horizontal?: boolean;
  } = $props();
</script>

<div
  class={[
    horizontal
      ? "flex flex-row-reverse items-center justify-end gap-2"
      : "flex flex-col gap-2",
  ]}
>
  {#if is_form}
    <FormLabel {...rest_props}>
      {label}
    </FormLabel>
  {:else}
    <Label {...rest_props}>
      {label}
    </Label>
  {/if}
  {@render children?.()}
</div>
