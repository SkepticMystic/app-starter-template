import { TIME } from "$lib/const/time.const";
import { Guard } from "./guard.util";

/** The empty-value sentinel, so the dash is written down once. */
export const EMPTY = "-";

const LOCALE = "en-ZA";

const DEFAULT_OPTIONS = {
  number: {
    style: "decimal",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  } satisfies Intl.NumberFormatOptions,

  percent: {
    style: "percent",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  } satisfies Intl.NumberFormatOptions,

  currency: {
    currency: "ZAR",
    style: "currency",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    currencyDisplay: "narrowSymbol",
  } satisfies Intl.NumberFormatOptions,

  date: {
    dateStyle: "medium",
    timeZone: TIME.ZONE,
  } satisfies Intl.DateTimeFormatOptions,

  datetime: {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIME.ZONE,
  } satisfies Intl.DateTimeFormatOptions,

  daterange: {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIME.ZONE,
  } satisfies Intl.DateTimeFormatOptions,
};

/**
 * The individual date fields. `dateStyle`/`timeStyle` are shorthands for a
 * whole field set, and `Intl.DateTimeFormat` THROWS `TypeError: Invalid option`
 * the moment either is passed alongside one of these.
 */
const COMPONENT_KEYS = [
  "weekday",
  "era",
  "year",
  "month",
  "day",
  "dayPeriod",
  "hour",
  "minute",
  "second",
  "fractionalSecondDigits",
  "timeZoneName",
] as const;

/**
 * Merge a caller's date options over a default set.
 *
 * The defaults here ARE styles, so `Format.date(d, { month: "short" })` used to
 * produce `{ dateStyle: "medium", month: "short" }` — an invalid pair that
 * threw and took the whole render down. When the caller spells out fields, the
 * styles are dropped. Only the styles: `timeZone` is not a component key and
 * survives both branches, which is what keeps the pinning above in force.
 */
const date_options = (
  defaults: Intl.DateTimeFormatOptions,
  opts?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions => {
  if (!opts) return defaults;

  const spells_out_fields = COMPONENT_KEYS.some((k) => opts[k] !== undefined);
  if (!spells_out_fields) return { ...defaults, ...opts };

  const { dateStyle: _d, timeStyle: _t, ...rest } = defaults;

  return { ...rest, ...opts };
};

/**
 * Constructing an `Intl` formatter is the expensive part; `.format()` is cheap,
 * and the hottest callers here are per-item renderers in a table.
 *
 * `CACHE_LIMIT` is a cap rather than an invariant — a provider-supplied
 * currency code can enter the key space — so it evicts oldest-first rather than
 * assuming the set is bounded.
 */
const CACHE_LIMIT = 64;
const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

const formatter = <T extends Intl.NumberFormat | Intl.DateTimeFormat>(
  kind: string,
  opts: object,
  make: () => T,
): T => {
  const key = `${kind}:${JSON.stringify(opts)}`;

  const hit = cache.get(key);
  if (hit) return hit as T;

  const made = make();

  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, made);

  return made;
};

const numeric =
  (kind: "number" | "percent" | "currency") =>
  (amount: number | undefined | null, opts?: Intl.NumberFormatOptions) => {
    if (Guard.is_nullish(amount) || Number.isNaN(amount)) return EMPTY;

    const merged = opts
      ? { ...DEFAULT_OPTIONS[kind], ...opts }
      : DEFAULT_OPTIONS[kind];

    return formatter(
      kind,
      merged,
      () => new Intl.NumberFormat(LOCALE, merged),
    ).format(amount);
  };

const temporal =
  (kind: "date" | "datetime") =>
  (
    date: Date | string | number | undefined | null,
    opts?: Intl.DateTimeFormatOptions,
  ) => {
    if (Guard.is_nullish(date)) return EMPTY;

    const dt = new Date(date);
    // `new Date("last tuesday")` is truthy and only fails at format time.
    if (Number.isNaN(dt.getTime())) return EMPTY;

    const merged = date_options(DEFAULT_OPTIONS[kind], opts);

    return formatter(
      kind,
      merged,
      () => new Intl.DateTimeFormat(LOCALE, merged),
    ).format(dt);
  };

export const Format = {
  EMPTY,

  number: numeric("number"),
  currency: numeric("currency"),
  percent: numeric("percent"),

  date: temporal("date"),
  datetime: temporal("datetime"),

  boolean: (bool: boolean, opts?: { type?: "Y/N" | "emoji" }) => {
    switch (opts?.type) {
      case "Y/N": {
        return bool ? "Yes" : "No";
      }

      // "emoji" is the default rendering, so it needs no case of its own.
      default: {
        return bool ? "✅" : "❌";
      }
    }
  },

  daterange: (
    range:
      | { start: Date | undefined; end: Date | undefined }
      | undefined
      | null,
    opts?: Intl.DateTimeFormatOptions,
  ) => {
    if (Guard.is_nullish(range) || (!range.start && !range.end)) return "";

    const merged = date_options(DEFAULT_OPTIONS.daterange, opts);
    const intl = formatter(
      "daterange",
      merged,
      () => new Intl.DateTimeFormat(LOCALE, merged),
    );

    /**
     * Wrapped rather than lifted. This previously did
     * `const format = DEFAULT_FORMATTERS.daterange.format`, and
     * `DateFormatter.format` reads `this` — so every call to `daterange` threw
     * "Cannot read properties of undefined (reading 'formatter')". Nothing
     * caught it because nothing tested it.
     */
    const format = (d: Date) => intl.format(d);

    if (range.start && range.end) {
      return `${format(range.start)} - ${format(range.end)}`;
    } else if (range.start) {
      return `From ${format(range.start)}`;
    } else {
      return `Until ${format(range.end!)}`;
    }
  },

  /**
   * Format minutes as human-readable duration
   * @param minutes - Number of minutes
   * @returns Formatted string like "2h 30m" or "45m"
   *
   * @example
   * Format.duration(150) // "2h 30m"
   * Format.duration(45)  // "45m"
   * Format.duration(0)   // "0m"
   */
  duration: (minutes: number | null | undefined): string => {
    if (Guard.is_nullish(minutes)) return "0m";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  },
};
