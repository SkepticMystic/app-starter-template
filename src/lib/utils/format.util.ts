import { DateFormatter } from "@internationalized/date";
import { Guard } from "./guard.util";

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
  } satisfies Intl.DateTimeFormatOptions,

  datetime: {
    dateStyle: "medium",
    timeStyle: "short",
  } satisfies Intl.DateTimeFormatOptions,

  daterange: {
    dateStyle: "medium",
    timeStyle: "short",
  } satisfies Intl.DateTimeFormatOptions,
};

const DEFAULT_FORMATTERS = {
  number: new Intl.NumberFormat("en", DEFAULT_OPTIONS.number),
  percent: new Intl.NumberFormat("en", DEFAULT_OPTIONS.percent),
  currency: new Intl.NumberFormat("en", DEFAULT_OPTIONS.currency),

  date: new DateFormatter("en-ZA", DEFAULT_OPTIONS.date),
  datetime: new DateFormatter("en-ZA", DEFAULT_OPTIONS.datetime),
  daterange: new DateFormatter("en-ZA", DEFAULT_OPTIONS.daterange),
} satisfies Record<
  keyof typeof DEFAULT_OPTIONS,
  Intl.NumberFormat | DateFormatter
>;

export const Format = {
  number: (
    amount: number | undefined | null,
    opts?: Intl.NumberFormatOptions,
  ) => {
    if (Guard.is_nullish(amount) || Guard.is_nan(amount)) {
      return "-";
    } else {
      return opts
        ? new Intl.NumberFormat("en", {
            ...DEFAULT_OPTIONS.number,
            ...opts,
          }).format(amount)
        : DEFAULT_FORMATTERS.number.format(amount);
    }
  },

  currency: (
    amount: number | undefined | null,
    opts?: Intl.NumberFormatOptions,
  ) => {
    if (Guard.is_nullish(amount) || Guard.is_nan(amount)) {
      return "-";
    } else {
      return opts
        ? new Intl.NumberFormat("en", {
            ...DEFAULT_OPTIONS.currency,
            ...opts,
          }).format(amount)
        : DEFAULT_FORMATTERS.currency.format(amount);
    }
  },

  percent: (
    amount: number | undefined | null,
    opts?: Intl.NumberFormatOptions,
  ) => {
    if (Guard.is_nullish(amount) || Guard.is_nan(amount)) {
      return "-";
    } else {
      return opts
        ? new Intl.NumberFormat("en", {
            ...DEFAULT_OPTIONS.percent,
            ...opts,
          }).format(amount)
        : DEFAULT_FORMATTERS.percent.format(amount);
    }
  },

  boolean: (bool: boolean, opts?: { type?: "Y/N" | "emoji" }) => {
    switch (opts?.type) {
      case "Y/N": {
        return bool ? "Yes" : "No";
      }

      case "emoji":
      default: {
        return bool ? "✅" : "❌";
      }
    }
  },

  date: (
    date: Date | string | number | undefined | null,
    opts?: Intl.DateTimeFormatOptions,
  ) => {
    if (Guard.is_nullish(date)) {
      return "-";
    } else {
      const dt = new Date(date);

      return opts
        ? new DateFormatter("en-ZA", {
            ...DEFAULT_OPTIONS.date,
            ...opts,
          }).format(dt)
        : DEFAULT_FORMATTERS.date.format(dt);
    }
  },

  datetime: (
    date: Date | string | number | undefined | null,
    opts?: Intl.DateTimeFormatOptions,
  ) => {
    if (Guard.is_nullish(date)) {
      return "-";
    } else {
      const dt = new Date(date);

      return opts
        ? new DateFormatter("en-ZA", {
            ...DEFAULT_OPTIONS.datetime,
            ...opts,
          }).format(dt)
        : DEFAULT_FORMATTERS.datetime.format(dt);
    }
  },

  daterange: (
    range:
      | { start: Date | undefined; end: Date | undefined }
      | undefined
      | null,
    opts?: Intl.DateTimeFormatOptions,
  ) => {
    if (Guard.is_nullish(range) || (!range.start && !range.end)) {
      return "";
    }

    const format = opts
      ? new DateFormatter("en-ZA", {
          ...DEFAULT_OPTIONS.daterange,
          ...opts,
        }).format
      : DEFAULT_FORMATTERS.daterange.format;

    if (range.start && range.end) {
      return `${format(range.start)} - ${format(range.end)}`;
    } else if (range.start) {
      return `From ${format(range.start)}`;
    } else {
      return `Until ${format(range.end!)}`;
    }
  },
};
