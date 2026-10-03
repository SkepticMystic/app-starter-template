<script lang="ts">
  import Icon from "#lib/components/ui/icon/Icon.svelte";
  import type { WithoutChildrenOrChild } from "#lib/utils/shadcn.util.js";
  import { Checkbox as CheckboxPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    checked = $bindable(false),
    indeterminate = $bindable(false),
    class: className,
    /*
     * Taken and dropped. The root is a `<button>`, and a remote form's `field.as("checkbox")`
     * carries `type: "checkbox"`, which a button reads as an invalid type and so as `submit`:
     * every tick submitted the form. Left out of the spread, bits' own `type="button"` stands.
     *
     * It posts through bits' hidden input, but that input fires no `input` event, so
     * `field.value()` does not follow a tick. Where a caller reads the value live, keep a
     * native checkbox.
     */
    type: _type,
    ...restProps
  }: Omit<WithoutChildrenOrChild<CheckboxPrimitive.RootProps>, "type"> & {
    type?: "checkbox";
  } = $props();
</script>

<CheckboxPrimitive.Root
  bind:ref
  data-slot="checkbox"
  class={[
    `
      peer flex size-4 shrink-0 items-center justify-center rounded-[4px] border
      border-input shadow-xs transition-shadow outline-none
      focus-visible:border-ring focus-visible:ring-[3px]
      focus-visible:ring-ring/50
      disabled:cursor-not-allowed disabled:opacity-50
      aria-invalid:border-destructive aria-invalid:ring-destructive/20
      data-[state=checked]:border-primary data-[state=checked]:bg-primary
      data-[state=checked]:text-primary-foreground
      dark:bg-input/30
      dark:aria-invalid:ring-destructive/40
      dark:data-[state=checked]:bg-primary
    `,
    className,
  ]}
  bind:checked
  bind:indeterminate
  {...restProps}
>
  {#snippet children({ checked, indeterminate })}
    <div
      data-slot="checkbox-indicator"
      class="text-current transition-none"
    >
      {#if checked}
        <Icon
          icon="lucide/check"
          class="size-3.5"
        />
      {:else if indeterminate}
        <Icon
          icon="lucide/minus"
          class="size-3.5"
        />
      {/if}
    </div>
  {/snippet}
</CheckboxPrimitive.Root>
