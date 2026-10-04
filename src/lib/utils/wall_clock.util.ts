import {
  fromDate,
  parseDateTime,
  toCalendarDateTime,
  toZoned,
} from "@internationalized/date";
// Relative, not `#lib`: `task.model.ts` imports this, and drizzle-kit loads the models.
import { TIME } from "../const/time.const.js";

/**
 * The inverse of `Format.datetime`. A `datetime-local` input posts wall clock with no zone,
 * which `new Date()` on the (UTC) server would misread; both directions are pinned to
 * {@link TIME.ZONE}, the zone rendering uses.
 */

/** Zoneless only: a value with `Z` or an offset already names an instant and must not be shifted. */
const WALL_CLOCK = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/**
 * Resolve a `datetime-local` value against {@link TIME.ZONE}, as an absolute ISO string.
 * Anything unrecognised comes back untouched for the caller's `z.coerce.date` to judge.
 */
const to_absolute_string = (local: string): string => {
  const raw = local.trim();

  if (!WALL_CLOCK.test(raw)) return raw;

  try {
    return toZoned(parseDateTime(raw), TIME.ZONE).toAbsoluteString();
  } catch {
    /* A well-shaped impossibility ("2026-02-30T10:00"); left for the caller's validation. */
    return raw;
  }
};

/** An instant as the `datetime-local` value meaning it in {@link TIME.ZONE}, not the browser's zone. */
const to_input_value = (at: Date): string =>
  toCalendarDateTime(fromDate(at, TIME.ZONE)).toString().slice(0, 16);

export const WallClock = {
  to_absolute_string,
  to_input_value,
};
