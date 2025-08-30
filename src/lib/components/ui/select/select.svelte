<script lang="ts">
  import * as Select from "$lib/components/ui/select/index.js";
  import type { SelectRootProps } from "bits-ui";

  let {
    items,
    ...rest_props
  }: SelectRootProps & { items: { value: string; label: string }[] } = $props();

  let item = $derived(items.find((i) => i.value === rest_props.value));
</script>

<Select.Root {...rest_props}>
  <Select.Trigger class="w-[180px]">
    {item?.label ?? "Select an option"}
  </Select.Trigger>

  <Select.Content>
    {#each items as item}
      <Select.Item value={item.value} label={item.label} />
    {/each}
  </Select.Content>
</Select.Root>
