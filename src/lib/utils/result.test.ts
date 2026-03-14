import { describe, expect, it } from "vitest";
import { result } from "./result.util";

describe("result", () => {
  describe("suc", () => {
    it("should create success result with data", () => {
      const res = result.suc({ value: 123 });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data).toEqual({ value: 123 });
      }
    });

    it("should create success result without data", () => {
      const res = result.suc();
      expect(res.ok).toBe(true);
    });

    it("should handle string data", () => {
      const res = result.suc("success");
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data).toBe("success");
      }
    });
  });

  describe("err", () => {
    it("should create error result with error", () => {
      const res = result.err({ message: "failed" });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toEqual({ message: "failed" });
      }
    });

    it("should create error result without error data", () => {
      const res = result.err();
      expect(res.ok).toBe(false);
    });

    it("should handle string error", () => {
      const res = result.err("error message");
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBe("error message");
      }
    });
  });

  describe("unwrap_or", () => {
    it("should return data from success result", () => {
      const res = result.suc(42);
      expect(result.unwrap_or(res, 0)).toBe(42);
    });

    it("should return default for error result", () => {
      const res = result.err("failed");
      expect(result.unwrap_or(res, 0)).toBe(0);
    });

    it("should return default for undefined result", () => {
      expect(result.unwrap_or(undefined, "default")).toBe("default");
    });

    it("should handle object defaults", () => {
      const res = result.err("failed");
      const defaultObj = { key: "value" };
      expect(result.unwrap_or(res, defaultObj)).toEqual(defaultObj);
    });
  });

  describe("pipe", () => {
    it("should transform success result", () => {
      const res = result.suc(5);
      const piped = result.pipe(res, (n) => n * 2);
      expect(piped.ok).toBe(true);
      if (piped.ok) {
        expect(piped.data).toBe(10);
      }
    });

    it("should pass through error result unchanged", () => {
      const res = result.err("failed");
      const piped = result.pipe(res, (n) => n * 2);
      expect(piped.ok).toBe(false);
      if (!piped.ok) {
        expect(piped.error).toBe("failed");
      }
    });

    it("should transform error with error handler", () => {
      const res = result.err("original error");
      const piped = result.pipe(
        res,
        (n) => n * 2,
        (e) => `transformed: ${e}`,
      );
      expect(piped.ok).toBe(false);
      if (!piped.ok) {
        expect(piped.error).toBe("transformed: original error");
      }
    });

    it("should chain multiple transformations", () => {
      const res = result.suc(10);
      const piped = result.pipe(
        result.pipe(res, (n) => n + 5),
        (n) => n * 2,
      );
      expect(piped.ok).toBe(true);
      if (piped.ok) {
        expect(piped.data).toBe(30);
      }
    });

    it("should handle object transformations", () => {
      const res = result.suc({ count: 5 });
      const piped = result.pipe(res, (data) => ({
        ...data,
        doubled: data.count * 2,
      }));
      expect(piped.ok).toBe(true);
      if (piped.ok) {
        expect(piped.data).toEqual({ count: 5, doubled: 10 });
      }
    });
  });
});
