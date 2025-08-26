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
};

const DEFAULT_FORMATTERS = {
  number: new Intl.NumberFormat("en", DEFAULT_OPTIONS.number),
  percent: new Intl.NumberFormat("en", DEFAULT_OPTIONS.percent),
  currency: new Intl.NumberFormat("en", DEFAULT_OPTIONS.currency),
};

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
};
