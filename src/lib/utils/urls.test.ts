import { describe, expect, it } from "vite-plus/test";
import { Url } from "./urls";

describe("Url", () => {
  describe("set_params", () => {
    it("keeps params it was not asked about", () => {
      // A search box that rewrites the URL must not lose the `limit` a paginator
      // reads back off it.
      expect(Url.set_params("limit=100&offset=50", { search: "ross" })).toBe(
        "?limit=100&offset=50&search=ross",
      );
    });

    it("builds a fresh query string from an empty base", () => {
      expect(Url.set_params("", { search: "ross" })).toBe("?search=ross");
    });

    it("patches a URLSearchParams without mutating it", () => {
      const base = new URLSearchParams("status=active");

      expect(Url.set_params(base, { search: "ross" })).toBe(
        "?status=active&search=ross",
      );
      expect(base.toString()).toBe("status=active");
    });

    it("replaces a key it already holds rather than appending a second copy", () => {
      expect(Url.set_params("status=active", { status: "dnc" })).toBe(
        "?status=dnc",
      );
    });

    it("leaves a key alone for `undefined`", () => {
      expect(Url.set_params("status=active", { status: undefined })).toBe(
        "?status=active",
      );
    });

    it("deletes a key for `null`", () => {
      expect(Url.set_params("status=active", { status: null })).toBe("?");
    });

    it("deletes a key for an empty string, because absent is how this app spells unfiltered", () => {
      expect(Url.set_params("search=ross", { search: "" })).toBe("?");
    });

    it("writes `false`, because a select's `false` option is a real choice", () => {
      // "The users who are *not* banned" is a filter, not the absence of one.
      expect(Url.set_params("banned=true", { banned: false })).toBe(
        "?banned=false",
      );
    });

    it("keeps `true` as a param", () => {
      expect(Url.set_params("", { banned: true })).toBe("?banned=true");
    });

    it("does not treat `0` as unset — a zero that means zero survives", () => {
      expect(Url.set_params("", { threshold: 0 })).toBe("?threshold=0");
    });

    it("writes a number", () => {
      expect(Url.set_params("", { offset: 50 })).toBe("?offset=50");
    });

    it("appends one param per array element, so getAll round-trips it", () => {
      expect(Url.set_params("", { tag: ["a", "b"] })).toBe("?tag=a&tag=b");
    });

    it("replaces an existing multi-valued key rather than growing it", () => {
      expect(Url.set_params("tag=a&tag=b", { tag: ["c"] })).toBe("?tag=c");
    });

    it("deletes the key for an empty array, which is how a multi-select is cleared", () => {
      expect(Url.set_params("tag=a&tag=b", { tag: [] })).toBe("?");
    });

    it("returns a bare `?` when everything has been cleared", () => {
      // A same-page navigation that empties the query, rather than the empty
      // string, which `goto` would read as "navigate to the current URL".
      expect(Url.set_params("search=ross", { search: null })).toBe("?");
    });

    it("applies a whole filter change and its page reset in one call", () => {
      // The shape every server-driven page needs: a filter moved, so page one.
      expect(
        Url.set_params("search=old&offset=350&limit=100", {
          search: "new",
          offset: null,
        }),
      ).toBe("?search=new&limit=100");
    });

    it("encodes what it is given", () => {
      expect(Url.set_params("", { search: "a b&c" })).toBe("?search=a+b%26c");
    });
  });

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
