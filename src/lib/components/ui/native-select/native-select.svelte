<script
  lang="ts"
  generics="V"
>
  import type { MaybePromise, SelectOption } from "$lib/interfaces";
  import { type WithElementRef } from "$lib/utils/shadcn.util.js";
  import type { HTMLSelectAttributes } from "svelte/elements";
  import NativeSelectOption from "./native-select-option.svelte";
  import NativeSelectRoot from "./native-select-root.svelte";

  let {
    options,
    children,
    on_value_select,
    value = $bindable(),
    ...restProps
  }: WithElementRef<HTMLSelectAttributes> & {
    value?: V;
    options?: SelectOption<V>[];
    on_value_select?: (value: V) => MaybePromise<unknown>;
  } = $props();
</script>

<NativeSelectRoot
  bind:value={
    () => (value === undefined ? "" : value),
    (v) => (value = v === "" ? undefined : v)
  }
  onchange={(_) => on_value_select?.(value)}
  {...restProps}
>
  {@render children?.()}

  {#if options?.length}
    {#each options as option (option.value)}
      <NativeSelectOption
        value={option.value}
        disabled={option.disabled}
      >
        {option.label}
      </NativeSelectOption>
    {/each}
  {/if}
</NativeSelectRoot>
