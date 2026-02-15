import { describe, expect, it } from "vitest";
import { Guard } from "./guard.util";

describe("Guard", () => {
  describe("is_nullish", () => {
    it("should return true for null", () => {
      expect(Guard.is_nullish(null)).toBe(true);
    });

    it("should return true for undefined", () => {
      expect(Guard.is_nullish(undefined)).toBe(true);
    });

    it("should return false for zero", () => {
      expect(Guard.is_nullish(0)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(Guard.is_nullish("")).toBe(false);
    });

    it("should return false for false", () => {
      expect(Guard.is_nullish(false)).toBe(false);
    });

    it("should return false for empty array", () => {
      expect(Guard.is_nullish([])).toBe(false);
    });

    it("should return false for empty object", () => {
      expect(Guard.is_nullish({})).toBe(false);
    });

    it("should return false for valid values", () => {
      expect(Guard.is_nullish("test")).toBe(false);
      expect(Guard.is_nullish(123)).toBe(false);
      expect(Guard.is_nullish({ key: "value" })).toBe(false);
    });
  });

  describe("is_nan", () => {
    it("should return true for NaN", () => {
      expect(Guard.is_nan(NaN)).toBe(true);
    });

    it("should return true for result of invalid operations", () => {
      expect(Guard.is_nan(0 / 0)).toBe(true);
      expect(Guard.is_nan(Number("not a number"))).toBe(true);
    });

    it("should return false for zero", () => {
      expect(Guard.is_nan(0)).toBe(false);
    });

    it("should return false for valid numbers", () => {
      expect(Guard.is_nan(123)).toBe(false);
      expect(Guard.is_nan(-456)).toBe(false);
      expect(Guard.is_nan(3.14)).toBe(false);
    });

    it("should return false for Infinity", () => {
      expect(Guard.is_nan(Infinity)).toBe(false);
      expect(Guard.is_nan(-Infinity)).toBe(false);
    });

    it("should return false for non-number values", () => {
      expect(Guard.is_nan("test")).toBe(false);
      expect(Guard.is_nan(null)).toBe(false);
      expect(Guard.is_nan(undefined)).toBe(false);
      expect(Guard.is_nan({})).toBe(false);
    });
  });
});
