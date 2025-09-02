<script lang="ts">
  import Icon from "$lib/components/icons/Icon.svelte";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import { Calendar } from "$lib/components/ui/calendar/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { cn } from "$lib/utils/shadcn.util";
  import {
    DateFormatter,
    fromDate,
    getLocalTimeZone,
    type DateValue,
  } from "@internationalized/date";

  let {
    value = $bindable(),
    onchange,
  }: {
    value: Date | undefined;
    onchange?: (date: Date | undefined) => void;
  } = $props();

  const df = new DateFormatter("en-US", {
    dateStyle: "medium",
  });

  let contentRef = $state<HTMLElement | null>(null);
  let instance: DateValue | undefined = $derived(
    value ? fromDate(value, getLocalTimeZone()) : undefined,
  );
</script>

<Popover.Root>
  <Popover.Trigger
    class={cn(
      buttonVariants({
        variant: "outline",
        class: "w-fit max-w-sm min-w-36 justify-between gap-2 font-normal",
      }),
      !value && "text-muted-foreground",
    )}
  >
    {instance ? df.format(instance.toDate(getLocalTimeZone())) : "Pick a date"}
    <Icon icon="lucide/calendar" />
  </Popover.Trigger>

  <Popover.Content bind:ref={contentRef} class="w-auto p-0">
    <Calendar
      type="single"
      value={instance}
      onValueChange={(date) => {
        instance = date;
        value = date?.toDate(getLocalTimeZone());
        onchange?.(value);
      }}
    />
  </Popover.Content>
</Popover.Root>
