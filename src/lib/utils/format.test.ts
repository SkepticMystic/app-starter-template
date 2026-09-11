import { describe, expect, it } from "vite-plus/test";
import { Format } from "./format.util";

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
