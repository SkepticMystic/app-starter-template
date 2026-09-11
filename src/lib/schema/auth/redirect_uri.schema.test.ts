import { describe, expect, it } from "vite-plus/test";
import { redirect_uri_schema } from "./redirect_uri.schema";

const parse = (value?: string) => redirect_uri_schema().parse(value);

describe("redirect_uri_schema", () => {
  it("keeps an ordinary same-origin path", () => {
    expect(parse("/home")).toBe("/home");
  });

  it("keeps a path with a query string", () => {
    expect(parse("/tasks?status=open")).toBe("/tasks?status=open");
  });

  it("falls back when nothing was supplied", () => {
    expect(parse()).toBe("/onboarding");
  });

  it("rejects an absolute URL", () => {
    expect(parse("https://evil.test/steal")).toBe("/onboarding");
  });

  it("rejects a protocol-relative URL", () => {
    // A browser follows `//evil.test` off-origin.
    expect(parse("//evil.test")).toBe("/onboarding");
  });

  it("rejects the backslash variant", () => {
    expect(parse(String.raw`/\evil.test`)).toBe("/onboarding");
  });

  it("rejects whitespace, which is a response-splitting primitive", () => {
    expect(parse("/home\nLocation: https://evil.test")).toBe("/onboarding");
    expect(parse("/home there")).toBe("/onboarding");
  });

  it("honours a caller's own fallback", () => {
    expect(redirect_uri_schema("/home").parse("https://evil.test")).toBe(
      "/home",
    );
  });
});
