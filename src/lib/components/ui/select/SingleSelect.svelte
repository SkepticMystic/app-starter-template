<script lang="ts" generics="V extends string">
  import * as Select from "$lib/components/ui/select/index.js";
  import type { SelectRootProps } from "bits-ui";

  type Option = { value: V; label: string };

  let {
    options,
    on_value_select,
    on_option_select,
    option = $bindable(),
    value = $bindable(),
    placeholder = "Select an option",
    ...rest_props
  }: Omit<SelectRootProps, "type" | "value" | "onValueChange"> & {
    value?: V;
    option?: Option;
    options: Option[];
    placeholder?: string;
    on_value_select?: (value?: V) => void;
    on_option_select?: (option?: Option) => void;
  } = $props();

  if (value && !option) {
    option = options.find((i) => i.value === value) as Option | undefined;
  } else if (option && !value) {
    value = option.value;
  }
</script>

<Select.Root
  {...rest_props}
  loop
  {value}
  type="single"
  items={options}
  onValueChange={(e) => {
    value = e as V;
    option = options.find((i) => i.value === value) as Option | undefined;

    on_option_select?.(option);
    on_value_select?.(value);
  }}
>
  <Select.Trigger class="w-fit max-w-sm" {placeholder}>
    {option?.label ?? placeholder}
  </Select.Trigger>

  <Select.Content>
    {#each options as option}
      <Select.Item value={option.value} label={option.label} />
    {/each}
  </Select.Content>
</Select.Root>
