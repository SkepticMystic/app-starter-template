<script
  lang="ts"
  generics="V extends string"
>
  import { Select as SelectPrimitive, type SelectRootProps } from "bits-ui";
  import SelectContent from "./select-content.svelte";
  import SelectItem from "./select-item.svelte";
  import SelectTrigger from "./select-trigger.svelte";

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

<SelectPrimitive.Root
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
  <SelectTrigger
    {loading}
    class="w-fit max-w-sm"
  >
    {selected.length === options.length
      ? "All selected"
      : selected.map((option) => option.label).join(", ") || placeholder}
  </SelectTrigger>

  <SelectContent>
    {#each options as option (option.value)}
      <SelectItem
        value={option.value}
        label={option.label}
      />
    {/each}
  </SelectContent>
</SelectPrimitive.Root>
