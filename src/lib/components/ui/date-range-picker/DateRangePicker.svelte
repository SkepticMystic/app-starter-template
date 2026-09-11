<script lang="ts">
  import { DateRanges } from "$lib/utils/date/date_range.util";
  import { Format } from "$lib/utils/format.util";
  import { getLocalTimeZone } from "@internationalized/date";
  import type { DateRange } from "bits-ui";
  import { buttonVariants } from "../button/button.svelte";
  import Icon from "../icon/Icon.svelte";
  import PopoverContent from "../popover/popover-content.svelte";
  import PopoverRoot from "../popover/popover-root.svelte";
  import PopoverTrigger from "../popover/popover-trigger.svelte";
  import RangeCalendar from "../range-calendar/range-calendar.svelte";

  /** A span of calendar days, in and out. Promoted from the dashboard by splitting rather than moving: this half
   * speaks bits-ui's `DateRange`, which is already the registered `date_range` filterFn's input — so no adapter. */

  let {
    value,
    label,
    id,
    placeholder = "Any dates",
    max_days,
    months = 2,
    align = "start",
    onchange,
  }: {
    value?: DateRange;
    /** Overrides the derived label — for a caller whose dates mean something other
     * than local calendar days, like the dashboard's reporting timezone. */
    label?: string;
    id?: string;
    placeholder?: string;
    /** Refuse a range longer than this, at the point of choosing rather than on submission. Handed to the calendar,
     * which checks whichever end was clicked first — an upper bound on the day only constrains a forward selection. */
    max_days?: number;
    months?: number;
    /** Which edge the popover hangs from — `"end"` for a trigger sitting at the
     * right of its row, which is where the dashboard's lives. */
    align?: "start" | "center" | "end";
    onchange: (range: DateRange) => void;
  } = $props();

  let open = $state(false);

  /** What the calendar is showing, which is not always what the caller holds: a
   * range is half-open between the two clicks that make it. */
  let range = $state<DateRange>({ start: value?.start, end: value?.end });

  /** The last value that arrived from outside, so the effect can tell "the caller changed this" from "our own commit
   * came back". Without it a parent handing back a new object each render would wipe a half-picked range. */
  let last_external = value;

  $effect(() => {
    if (DateRanges.same_range(value, last_external)) return;

    last_external = value;
    range = { start: value?.start, end: value?.end };
  });

  /** Local zone, and only for the label. The dates themselves carry none — see
   * `label` above for the caller that needs a different story. */
  const derived_label = $derived.by(() => {
    if (!range.start || !range.end) return placeholder;

    const tz = getLocalTimeZone();

    return Format.daterange(
      { start: range.start.toDate(tz), end: range.end.toDate(tz) },
      { dateStyle: "medium", timeStyle: undefined },
    );
  });

  const commit = (next: DateRange) => {
    // The first of the two clicks leaves the range half-open, and a half-open range
    // filters nothing — so it stays in the calendar rather than going out.
    if (!next.start || !next.end) return;

    open = false;
    onchange(next);
  };
</script>

<PopoverRoot bind:open>
  <PopoverTrigger
    {id}
    class={buttonVariants({ variant: "outline" })}
  >
    <Icon icon="lucide/calendar" />
    {label ?? derived_label}
  </PopoverTrigger>

  <PopoverContent
    class="w-auto p-0"
    {align}
  >
    <RangeCalendar
      bind:value={range}
      maxDays={max_days}
      onValueChange={commit}
      numberOfMonths={months}
    />
  </PopoverContent>
</PopoverRoot>
