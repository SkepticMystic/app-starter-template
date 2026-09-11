import type { DateRange } from "bits-ui";

/** The rules a range picker follows, kept out of the component so they can be tested:
 * `CalendarDate` arithmetic is exactly what is wrong by one day and looks right. */

/* NOTE: the length cap lives on `RangeCalendar`'s `maxDays`, which checks whichever end was
 * clicked first — an upper-bound-on-day version walked straight past it backwards. */

/** Whether two ranges name the same days — by value, so a picker re-seeding on a new object
 * cannot wipe a start the user picked but has not yet paired with an end. */
const same_range = (a: DateRange | undefined, b: DateRange | undefined) =>
  a?.start?.toString() === b?.start?.toString() &&
  a?.end?.toString() === b?.end?.toString();

/** Whether a range is actually narrowing anything. A half-open one is not — the filterFn
 * passes every row until both ends are picked, so Clear would light over an unfiltered table. */
const is_complete = (range: DateRange | undefined) =>
  Boolean(range?.start && range.end);

export const DateRanges = {
  is_complete,
  same_range,
};
