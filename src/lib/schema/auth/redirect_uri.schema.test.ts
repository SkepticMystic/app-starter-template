import { describe, expect, it } from "vite-plus/test";
import { redirect_uri_schema } from "./redirect_uri.schema.js";

// The cases themselves are `safe_redirect_uri`'s; this is the wiring.
describe("redirect_uri_schema", () => {
  it("keeps a same-origin path", () => {
    expect(redirect_uri_schema().parse("/home")).toBe("/home");
  });

  it("falls back when nothing was supplied", () => {
    expect(redirect_uri_schema().parse(undefined)).toBe("/onboarding");
  });

  it("falls back on a rejected value rather than failing", () => {
    expect(redirect_uri_schema().safeParse("//evil.test")).toEqual({
      success: true,
      data: "/onboarding",
    });
  });

  it("honours a caller's own fallback", () => {
    expect(redirect_uri_schema("/home").parse("https://evil.test")).toBe(
      "/home",
    );
  });
});
