<script lang="ts">
  import Icon from "$lib/components/icons/Icon.svelte";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { RangeCalendar } from "$lib/components/ui/range-calendar/index";
  import { Format } from "$lib/utils/format.util";
  import { cn } from "$lib/utils/shadcn.util";
  import { type DateValue, getLocalTimeZone } from "@internationalized/date";
  import type { DateRange } from "bits-ui";

  let {
    placeholder,
    value = $bindable(),
  }: {
    value: DateRange | undefined;
    placeholder?: string;
  } = $props();

  const tz = getLocalTimeZone();
  let startValue: DateValue | undefined = $state(undefined);
</script>

<div class="grid gap-2">
  <Popover.Root>
    <Popover.Trigger
      class={cn(
        buttonVariants({ variant: "outline" }),
        !value && "text-muted-foreground",
      )}
    >
      <Icon icon="lucide/calendar" />

      {#if value && value.start}
        {#if value.end}
          {Format.date(value.start.toDate(tz))} - {Format.date(
            value.end.toDate(tz),
          )}
        {:else}
          {Format.date(value.start.toDate(tz))}
        {/if}
      {:else if startValue}
        {Format.date(startValue.toDate(tz))}
      {:else}
        {placeholder ?? "Pick a date range"}
      {/if}
    </Popover.Trigger>

    <Popover.Content class="w-auto p-0" align="start">
      <RangeCalendar
        bind:value
        numberOfMonths={2}
        onStartValueChange={(v) => (startValue = v)}
      />
    </Popover.Content>
  </Popover.Root>
</div>
