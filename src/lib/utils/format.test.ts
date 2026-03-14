import { describe, expect, it } from "vitest";
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
