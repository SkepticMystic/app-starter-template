<script lang="ts" generics="V extends string">
  import * as Select from "$lib/components/ui/select/index.js";
  import type { SelectRootProps } from "bits-ui";

  type Option = { value: V; label: string };

  let {
    options,
    on_value_select,
    value = $bindable(),
    placeholder = "Select an option",
    ...rest_props
  }: Omit<SelectRootProps, "type" | "value" | "onValueChange"> & {
    value?: V;
    options: Option[];
    placeholder?: string;
    on_value_select?: (value?: V) => void;
  } = $props();

  let option = $derived(options.find((i) => i.value === value));
</script>

<Select.Root
  {...rest_props}
  loop
  {value}
  type="single"
  items={options}
  onValueChange={(e) => {
    value = e as V;

    on_value_select?.(value);
  }}
>
  <Select.Trigger class="w-fit max-w-sm">
    {option?.label ?? value ?? placeholder}
  </Select.Trigger>

  <Select.Content>
    {#each options as option}
      <Select.Item value={option.value} label={option.label} />
    {/each}
  </Select.Content>
</Select.Root>
