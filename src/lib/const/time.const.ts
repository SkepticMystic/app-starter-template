const MIN = 1000 * 60;
const HOUR = MIN * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const YEAR = DAY * 365;
const MONTH = YEAR / 12;

/**
 * The timezone every date in this app is rendered in.
 *
 * A decision, not a default. Left unset, `Intl` resolves to the host zone —
 * UTC inside the Vercel function, the reader's own zone in the browser — so the
 * same instant renders differently server-side and after hydration. It is not
 * merely a shift either: anything stamped late in the evening renders under the
 * *previous date* server-side, so yesterday-evening rows arrive dated wrong and
 * then silently correct themselves.
 *
 * The exit path, when this app needs more than one: add an
 * `organization.timezone` column and read it into the two places that consume
 * this.
 */
const ZONE = "Africa/Johannesburg";

export const TIME = {
  ZONE,
  MIN,
  HOUR,
  DAY,
  WEEK,
  MONTH,
  YEAR,
};
