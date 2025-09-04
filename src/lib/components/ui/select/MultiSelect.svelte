<script lang="ts" generics="V extends string">
  import * as Select from "$lib/components/ui/select/index.js";
  import type { SelectRootProps } from "bits-ui";

  type Option = { value: V; label: string };

  let {
    options,
    loading,
    disabled,
    on_value_change,
    value = $bindable(),
    placeholder = "Select an option",
    ...rest_props
  }: Omit<SelectRootProps, "type" | "value" | "onValueChange" | "items"> & {
    value?: V[];
    options: Option[];
    loading?: boolean;
    placeholder?: string;
    on_value_change?: (value?: V[]) => void;
  } = $props();

  let selected = $derived(
    options.filter((option) => value?.includes(option.value)),
  );
</script>

<Select.Root
  {...rest_props}
  loop
  {value}
  type="multiple"
  items={options}
  disabled={disabled || loading}
  onValueChange={(e) => {
    value = e as V[];

    on_value_change?.(value);
  }}
>
  <Select.Trigger {loading} class="w-fit max-w-sm">
    {selected.length === options.length
      ? "All selected"
      : selected.map((option) => option.label).join(", ") || placeholder}
  </Select.Trigger>

  <Select.Content>
    {#each options as option (option.value)}
      <Select.Item value={option.value} label={option.label} />
    {/each}
  </Select.Content>
</Select.Root>
