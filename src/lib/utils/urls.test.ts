import { describe, expect, it } from "vitest";
import { Url } from "./urls";

describe("Url", () => {
  describe("safe", () => {
    it("should parse valid URL", () => {
      const url = Url.safe("https://example.com");
      expect(url).not.toBeNull();
      expect(url?.hostname).toBe("example.com");
    });

    it("should return null for invalid URL", () => {
      const url = Url.safe("not a url");
      expect(url).toBeNull();
    });

    it("should handle complex URLs", () => {
      const url = Url.safe("https://example.com/path?query=value#hash");
      expect(url).not.toBeNull();
      expect(url?.pathname).toBe("/path");
      expect(url?.search).toBe("?query=value");
      expect(url?.hash).toBe("#hash");
    });
  });
});
