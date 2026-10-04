import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { Format } from "./format.util.js";

// Whitespace aside: the locale puts a no-break space after the symbol.
const bare = (text: string) => text.replaceAll(/\s/g, "");

describe("Format", () => {
  describe("duration", () => {
    it("should format hours and minutes", () => {
      expect(Format.duration(150)).toBe("2h 30m");
    });

    it("should format minutes only", () => {
      expect(Format.duration(45)).toBe("45m");
    });

    it("should format hours only", () => {
      expect(Format.duration(120)).toBe("2h");
    });

    it("should handle zero", () => {
      expect(Format.duration(0)).toBe("0m");
    });

    it("should handle null/undefined", () => {
      expect(Format.duration(null)).toBe("0m");
      expect(Format.duration(undefined)).toBe("0m");
    });
  });

  describe("currency", () => {
    it("always shows two decimals, so amounts line up", () => {
      expect(bare(Format.currency(1234.5))).toBe("R1,234.50");
      expect(bare(Format.currency(12))).toBe("R12.00");
    });

    // The billing page's preset buttons and chart axis: max below the default floor of two.
    it("lowers the floor to a caller's maximum instead of throwing", () => {
      expect(bare(Format.currency(1234.5, { maximumFractionDigits: 0 }))).toBe(
        "R1,235",
      );
    });

    it("keeps the floor under a larger maximum", () => {
      expect(bare(Format.currency(0.25, { maximumFractionDigits: 6 }))).toBe(
        "R0.25",
      );
      expect(
        bare(Format.currency(0.000_123, { maximumFractionDigits: 6 })),
      ).toBe("R0.000123");
    });
  });

  describe("number", () => {
    it("raises the ceiling to a caller's minimum instead of throwing", () => {
      expect(Format.number(1.5, { minimumFractionDigits: 3 })).toBe("1.500");
    });
  });

  describe("percent", () => {
    it("rounds to one decimal at most", () => {
      expect(Format.percent(0.345_67)).toBe("34.6%");
      expect(Format.percent(0.5)).toBe("50%");
    });
  });

  describe("duration_sec", () => {
    it("should format seconds only", () => {
      expect(Format.duration_sec(45)).toBe("45s");
    });

    it("should format minutes and seconds", () => {
      expect(Format.duration_sec(83)).toBe("1m 23s");
    });

    it("should format hours, minutes and seconds", () => {
      expect(Format.duration_sec(3723)).toBe("1h 2m 3s");
    });

    // `Intl.DurationFormat` drops zero-valued units. @see DEFAULT_OPTIONS.duration
    it("should drop the minutes place when it is zero", () => {
      expect(Format.duration_sec(3601)).toBe("1h 1s");
    });

    it("should handle zero", () => {
      expect(Format.duration_sec(0)).toBe("0s");
    });

    it("should floor a fractional second rather than rendering nothing", () => {
      expect(Format.duration_sec(0.4)).toBe("0s");
      expect(Format.duration_sec(59.8)).toBe("59s");
    });

    it("should read nullish as unknown, not as no time", () => {
      expect(Format.duration_sec(null)).toBe("-");
      expect(Format.duration_sec(undefined)).toBe("-");
      expect(Format.duration_sec(Number.NaN)).toBe("-");
    });
  });

  describe("relative", () => {
    const now = new Date("2026-08-18T12:00:00Z");
    const at = (offset_ms: number) => new Date(now.getTime() + offset_ms);

    beforeEach(() => vi.useFakeTimers({ now }));
    afterEach(() => vi.useRealTimers());

    it("should read a future gap as a wait", () => {
      expect(Format.relative(at(5 * 60_000))).toBe("in 5 minutes");
      expect(Format.relative(at(6 * 3_600_000))).toBe("in 6 hours");
    });

    it("should read a past gap as elapsed", () => {
      expect(Format.relative(at(-45 * 1_000))).toBe("45 seconds ago");
      expect(Format.relative(at(-3 * 604_800_000))).toBe("3 weeks ago");
    });

    it("should pick the largest unit the gap clears", () => {
      expect(Format.relative(at(90 * 60_000))).toBe("in 2 hours");
    });

    it("should name the neighbouring day rather than count it", () => {
      expect(Format.relative(at(86_400_000))).toBe("tomorrow");
      expect(Format.relative(at(-86_400_000))).toBe("yesterday");
    });

    it("should collapse a sub-second gap to now", () => {
      expect(Format.relative(at(0))).toBe("now");
      expect(Format.relative(at(-400))).toBe("now");
    });

    it("should take options through to the formatter", () => {
      expect(Format.relative(at(86_400_000), { numeric: "always" })).toBe(
        "in 1 day",
      );
    });

    it("should measure against `from` instead of the clock", () => {
      const stamp = at(-30 * 60_000);

      expect(Format.relative(stamp, undefined, now)).toBe("30 minutes ago");
      expect(Format.relative(stamp, undefined, at(90 * 60_000))).toBe(
        "2 hours ago",
      );
    });

    it("should take `from` as epoch ms as readily as a date", () => {
      expect(
        Format.relative(at(-2 * 3_600_000), undefined, now.getTime()),
      ).toBe("2 hours ago");
    });

    it("should read nullish and unparseable as unknown", () => {
      expect(Format.relative(null)).toBe("-");
      expect(Format.relative(undefined)).toBe("-");
      expect(Format.relative("not a date")).toBe("-");
    });
  });

  describe("timezone", () => {
    const late = new Date("2026-08-14T22:30:00.000Z");

    it("should render a date in SAST whatever zone the host runs in", () => {
      expect(Format.date(late)).toBe("15 Aug 2026");
    });

    it("should render a datetime in SAST whatever zone the host runs in", () => {
      expect(Format.datetime(late)).toBe("15 Aug 2026, 00:30");
    });

    it("should render a range in SAST whatever zone the host runs in", () => {
      expect(
        Format.daterange({
          start: late,
          end: new Date("2026-08-15T06:00:00.000Z"),
        }),
      ).toBe("15 Aug 2026, 00:30 - 15 Aug 2026, 08:00");
    });

    it("should keep the zone when a caller narrows to individual fields", () => {
      // `date_options` drops `dateStyle`/`timeStyle` here, and must keep `timeZone`.
      expect(Format.date(late, { month: "short", day: "numeric" })).toBe(
        "15 Aug",
      );
    });

    it("should let a caller override the zone explicitly", () => {
      expect(Format.datetime(late, { timeZone: "UTC" })).toBe(
        "14 Aug 2026, 22:30",
      );
    });

    it("should name the zone when asked for one", () => {
      expect(
        Format.datetime(late, { dateStyle: "full", timeStyle: "long" }),
      ).toContain("SAST");
    });
  });
});

// ---------------------------------------------------------------------------
// The three bugs the rewrite fixed
// ---------------------------------------------------------------------------

describe("Format.date with spelled-out fields", () => {
  it("does not throw when a component field is given alongside the style default", () => {
    // `{ dateStyle: "medium", month: "short" }` is an invalid pair and
    // `Intl.DateTimeFormat` throws `TypeError: Invalid option` on it.
    expect(() =>
      Format.date("2026-03-14T10:00:00Z", { month: "short", day: "numeric" }),
    ).not.toThrow();
  });

  it("honours the spelled-out fields", () => {
    const out = Format.date("2026-03-14T10:00:00Z", {
      month: "short",
      day: "numeric",
    });

    expect(out).toContain("14");
    expect(out).toContain("Mar");
  });

  it("still merges plain options that are not component fields", () => {
    expect(() =>
      Format.date("2026-03-14T10:00:00Z", { dateStyle: "full" }),
    ).not.toThrow();
  });
});

describe("Format.daterange", () => {
  const start = new Date("2026-03-14T10:00:00Z");
  const end = new Date("2026-03-16T10:00:00Z");

  it("does not throw — it used to, on every single call", () => {
    // `const format = formatter.format` lifted the method off the instance,
    // and DateFormatter.format reads `this`.
    expect(() => Format.daterange({ start, end })).not.toThrow();
  });

  it("renders both ends", () => {
    const out = Format.daterange({ start, end });

    expect(out).toContain(" - ");
    expect(out).toContain("14");
    expect(out).toContain("16");
  });

  it("renders an open start", () => {
    expect(Format.daterange({ start, end: undefined })).toMatch(/^From /);
  });

  it("renders an open end", () => {
    expect(Format.daterange({ start: undefined, end })).toMatch(/^Until /);
  });

  it("is empty when neither end is set", () => {
    expect(Format.daterange({ start: undefined, end: undefined })).toBe("");
  });
});

describe("timezone pinning", () => {
  it("renders the same instant identically regardless of the host zone", () => {
    // The SSR/hydration mismatch: without an explicit timeZone this reads as
    // the 14th in UTC and the 15th in Africa/Johannesburg.
    const late = "2026-03-14T22:30:00Z";

    expect(Format.date(late)).toContain("15");
  });
});

describe("Format.date invalid input", () => {
  it("returns the sentinel rather than throwing a RangeError", () => {
    expect(Format.date("last tuesday")).toBe("-");
  });
});
