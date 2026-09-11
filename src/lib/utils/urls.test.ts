import { describe, expect, it } from "vite-plus/test";
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

describe("Url.build search params", () => {
  it("passes a string value through instead of JSON-quoting it", () => {
    // `JSON.stringify("ross")` is `"\"ross\""`, which arrived as ?q=%22ross%22
    const url = Url.build("https://x.test", "/search", { q: "ross" });

    expect(url?.searchParams.get("q")).toBe("ross");
  });

  it("still serialises a non-string value", () => {
    const url = Url.build("https://x.test", "/search", { page: 2, on: true });

    expect(url?.searchParams.get("page")).toBe("2");
    expect(url?.searchParams.get("on")).toBe("true");
  });

  it("skips undefined values", () => {
    const url = Url.build("https://x.test", "/search", { q: undefined });

    expect(url?.searchParams.has("q")).toBe(false);
  });
});
