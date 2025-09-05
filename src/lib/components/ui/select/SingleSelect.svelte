<script lang="ts" generics="V extends string">
  import * as Select from "$lib/components/ui/select/index.js";
  import type { MaybePromise } from "$lib/interfaces";
  import { cn } from "$lib/utils/shadcn.util";
  import type { SelectRootProps } from "bits-ui";
  import type { ClassValue } from "svelte/elements";

  type Option = { value: V; label: string };

  let {
    options,
    loading,
    disabled,
    on_value_select,
    value = $bindable(),
    placeholder = "Select an option",
    ...rest
  }: Omit<SelectRootProps, "type" | "value" | "onValueChange"> & {
    value?: V;
    options: Option[];
    loading?: boolean;
    class?: ClassValue;
    placeholder?: string;
    on_value_select?: (value: V) => MaybePromise<unknown>;
  } = $props();

  let option = $derived(options.find((i) => i.value === value));
</script>

<Select.Root
  loop
  {value}
  type="single"
  items={options}
  disabled={disabled || loading}
  onValueChange={async (e) => {
    value = e as V;

    loading = true;
    await on_value_select?.(value);
    loading = false;
  }}
  {...rest}
>
  <Select.Trigger {loading} class={cn("w-fit max-w-sm", rest.class)}>
    {option?.label ?? placeholder}
  </Select.Trigger>

  <Select.Content>
    {#each options as option (option.value)}
      <Select.Item value={option.value} label={option.label} />
    {/each}
  </Select.Content>
</Select.Root>
