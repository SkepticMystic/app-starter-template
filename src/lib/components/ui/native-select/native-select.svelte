<script
  lang="ts"
  generics="V"
>
  import type { MaybePromise, SelectOption } from "$lib/interfaces";
  import { cn, type WithElementRef } from "$lib/utils/shadcn.util.js";
  import type { HTMLSelectAttributes } from "svelte/elements";
  import Icon from "../icon/Icon.svelte";
  import NativeSelectOption from "./native-select-option.svelte";

  let {
    value = $bindable(),
    class: className,
    children,
    options,
    placeholder = "Select an option",
    on_value_select,
    ...restProps
  }: WithElementRef<HTMLSelectAttributes> & {
    value?: V;
    options?: SelectOption<V>[];
    on_value_select?: (value: V) => MaybePromise<unknown>;
  } = $props();
</script>

<div
  class="group/native-select relative w-fit has-[select:disabled]:opacity-50"
  data-slot="native-select-wrapper"
>
  <select
    {placeholder}
    data-slot="native-select"
    class={cn(
      "h-9 w-full min-w-0 appearance-none rounded-md border border-input bg-transparent px-3 py-2 pr-9 text-sm shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed dark:bg-input/30 dark:hover:bg-input/50",
      "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
      "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
      className,
    )}
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
  </select>

  <Icon
    aria-hidden="true"
    icon="lucide/chevron-down"
    data-slot="native-select-icon"
    class="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground opacity-50 select-none"
  />
</div>
