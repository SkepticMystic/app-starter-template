import { describe, expect, it } from "vitest";
import { Json } from "./json";

describe("Json", () => {
  describe("str_or_stringify", () => {
    it("should return string as-is", () => {
      expect(Json.str_or_stringify("hello")).toBe("hello");
    });

    it("should stringify objects", () => {
      const obj = { name: "test", value: 123 };
      const result = Json.str_or_stringify(obj);
      expect(result).toBe(JSON.stringify(obj, null, 2));
      expect(result).toContain('"name": "test"');
    });

    it("should stringify arrays", () => {
      const arr = [1, 2, 3];
      const result = Json.str_or_stringify(arr);
      expect(result).toBe(JSON.stringify(arr, null, 2));
    });

    it("should stringify null", () => {
      expect(Json.str_or_stringify(null)).toBe("null");
    });

    it("should stringify undefined", () => {
      expect(Json.str_or_stringify(undefined)).toBe(undefined);
    });

    it("should stringify numbers", () => {
      expect(Json.str_or_stringify(123)).toBe("123");
    });

    it("should stringify booleans", () => {
      expect(Json.str_or_stringify(true)).toBe("true");
      expect(Json.str_or_stringify(false)).toBe("false");
    });

    it("should handle nested objects with pretty formatting", () => {
      const nested = { outer: { inner: "value" } };
      const result = Json.str_or_stringify(nested);
      expect(result).toContain("  ");
      expect(result).toContain("outer");
      expect(result).toContain("inner");
    });

    it("should handle empty string", () => {
      expect(Json.str_or_stringify("")).toBe("");
    });
  });
});
