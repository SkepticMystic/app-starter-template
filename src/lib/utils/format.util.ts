import { TIME } from "#lib/const/time.const.js";
import { Guard } from "./guard.util";

/** The empty-value sentinel, so the dash is written down once. */
export const EMPTY = "-";

/**
 * Dates read the South African way ("15 Aug 2026"). Numbers do not: `en-ZA` groups with a
 * space and decimals with a comma ("R 1 234,50"), which nobody here writes, so they use `en`.
 */
const DATE_LOCALE = "en-ZA";
const NUMBER_LOCALE = "en";

const DEFAULT_OPTIONS = {
  number: {
    style: "decimal",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  } satisfies Intl.NumberFormatOptions,

  /** One decimal at most: "34.6%", never "34.57%", which is precision nobody acts on. */
  percent: {
    style: "percent",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  } satisfies Intl.NumberFormatOptions,

  /** Always two decimals: "R1,234.50", not "R1,234.5" beside a "R12.50". */
  currency: {
    currency: "ZAR",
    style: "currency",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
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

  relative: {
    // "yesterday" and "tomorrow" over "1 day ago" and "in 1 day".
    numeric: "auto",
  } satisfies Intl.RelativeTimeFormatOptions,
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
const cache = new Map<
  string,
  Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat
>();

const formatter = <
  T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat,
>(
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

/**
 * A caller's fraction bound drags the default's other bound with it. Currency's floor is two
 * decimals, so "whole rand" (`maximumFractionDigits: 0`) spread over it is max < min, which
 * `Intl.NumberFormat` throws on as a `RangeError`. A caller that sets both bounds gets them as
 * given.
 */
const number_options = (
  kind: "number" | "currency" | "percent",
  opts: Intl.NumberFormatOptions | undefined,
): Intl.NumberFormatOptions => {
  const merged: Intl.NumberFormatOptions = {
    ...DEFAULT_OPTIONS[kind],
    ...opts,
  };
  const min = merged.minimumFractionDigits ?? 0;
  const max = merged.maximumFractionDigits ?? min;

  if (max >= min) return merged;
  if (opts?.minimumFractionDigits === undefined) {
    return { ...merged, minimumFractionDigits: max };
  }
  if (opts.maximumFractionDigits === undefined) {
    return { ...merged, maximumFractionDigits: min };
  }

  return merged;
};

const numeric =
  (kind: "number" | "percent" | "currency") =>
  (amount: number | undefined | null, opts?: Intl.NumberFormatOptions) => {
    if (Guard.is_nullish(amount) || Number.isNaN(amount)) return EMPTY;

    const merged = number_options(kind, opts);

    return formatter(
      kind,
      merged,
      () => new Intl.NumberFormat(NUMBER_LOCALE, merged),
    ).format(amount);
  };

/** Largest-first: the unit is the largest one the gap clears. */
const RELATIVE_UNITS = [
  ["year", 31_557_600_000],
  ["month", 2_629_800_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
  ["second", 1_000],
] as const satisfies readonly (readonly [
  Intl.RelativeTimeFormatUnit,
  number,
])[];

type DurationParts = { hours?: number; minutes?: number; seconds?: number };

/**
 * `Intl.DurationFormat`'s `narrow` style — "1h 2m 3s", dropping zero units so 3601s reads
 * "1h 1s". Node 24 has it, as do current browsers; an older browser gets the same string built
 * by hand rather than a `TypeError` at module load that would take every page down.
 */
const DURATION_FORMAT =
  typeof Intl.DurationFormat === "function"
    ? new Intl.DurationFormat(DATE_LOCALE, { style: "narrow" })
    : null;

const duration_format: (parts: DurationParts) => string = DURATION_FORMAT
  ? (parts) => DURATION_FORMAT.format(parts)
  : ({ hours = 0, minutes = 0, seconds = 0 }) =>
      [
        hours ? `${hours}h` : "",
        minutes ? `${minutes}m` : "",
        seconds ? `${seconds}s` : "",
      ]
        .filter(Boolean)
        .join(" ");

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
      () => new Intl.DateTimeFormat(DATE_LOCALE, merged),
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
      () => new Intl.DateTimeFormat(DATE_LOCALE, merged),
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
   * Format a date as a gap from now — "in 5 minutes", "2 hours ago", "tomorrow".
   *
   * Does not tick; `<Time show="relative">` re-renders on a shared clock. `from` is kept out of
   * `opts` because `opts` is the formatter cache key.
   *
   * @example
   * Format.relative(Date.now() + 5 * 60_000)  // "in 5 minutes"
   * Format.relative(Date.now() - 90 * 60_000) // "2 hours ago"
   * Format.relative(Date.now())               // "now"
   * Format.relative(null)                     // "-"
   */
  relative: (
    date: Date | string | number | undefined | null,
    opts?: Intl.RelativeTimeFormatOptions,
    from: Date | number = Date.now(),
  ) => {
    if (Guard.is_nullish(date)) return EMPTY;

    const ms = new Date(date).getTime();
    if (Number.isNaN(ms)) return EMPTY;

    const delta = ms - (from instanceof Date ? from.getTime() : from);

    // Under a second falls back to seconds, and a rounded 0 reads as "now".
    const [unit, size] =
      RELATIVE_UNITS.find(([, threshold]) => Math.abs(delta) >= threshold) ??
      (["second", 1_000] as const);

    const merged = { ...DEFAULT_OPTIONS.relative, ...opts };

    return formatter(
      "relative",
      merged,
      () => new Intl.RelativeTimeFormat(NUMBER_LOCALE, merged),
    ).format(Math.round(delta / size), unit);
  },

  /**
   * Format minutes as a human-readable duration.
   *
   * @example
   * Format.duration(150) // "2h 30m"
   * Format.duration(45)  // "45m"
   * Format.duration(0)   // "0m"
   */
  duration: (minutes: number | null | undefined): string => {
    // `Intl` renders a zero duration as "".
    if (Guard.is_nullish(minutes) || minutes === 0) return "0m";

    return duration_format({
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
    });
  },

  /**
   * Format seconds as a human-readable duration. Nullish reads as "-" rather than "0s": a
   * duration not known yet is not no time.
   *
   * @example
   * Format.duration_sec(45)   // "45s"
   * Format.duration_sec(83)   // "1m 23s"
   * Format.duration_sec(3723) // "1h 2m 3s"
   * Format.duration_sec(3601) // "1h 1s" — no padded zero minute
   * Format.duration_sec(null) // "-"
   */
  duration_sec: (seconds: number | null | undefined): string => {
    if (Guard.is_nullish(seconds) || Number.isNaN(seconds)) return EMPTY;

    // `Intl` would render zero as "".
    if (seconds < 1) return "0s";

    return duration_format({
      hours: Math.floor(seconds / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
      seconds: Math.floor(seconds % 60),
    });
  },
};
