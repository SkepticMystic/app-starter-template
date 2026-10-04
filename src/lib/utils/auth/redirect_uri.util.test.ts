import { describe, expect, it } from "vite-plus/test";
import { safe_redirect_uri } from "./redirect_uri.util.js";

describe("safe_redirect_uri", () => {
  it("keeps an ordinary same-origin path", () => {
    expect(safe_redirect_uri("/home")).toBe("/home");
  });

  it("keeps a path with a query string", () => {
    expect(safe_redirect_uri("/tasks?status=open")).toBe("/tasks?status=open");
  });

  it("falls back when nothing was supplied", () => {
    expect(safe_redirect_uri(undefined)).toBe("/onboarding");
    // What `searchParams.get` answers for a missing key.
    expect(safe_redirect_uri(null)).toBe("/onboarding");
    expect(safe_redirect_uri("")).toBe("/onboarding");
  });

  it("rejects an absolute URL", () => {
    expect(safe_redirect_uri("https://evil.test/steal")).toBe("/onboarding");
  });

  it("rejects a protocol-relative URL", () => {
    // A browser follows `//evil.test` off-origin.
    expect(safe_redirect_uri("//evil.test")).toBe("/onboarding");
  });

  it("rejects an over-long path", () => {
    expect(safe_redirect_uri(`/${"a".repeat(2048)}`)).toBe("/onboarding");
  });

  it("rejects the backslash variant", () => {
    expect(safe_redirect_uri(String.raw`/\evil.test`)).toBe("/onboarding");
  });

  it("rejects whitespace, which is a response-splitting primitive", () => {
    expect(safe_redirect_uri("/home\nLocation: https://evil.test")).toBe(
      "/onboarding",
    );
    expect(safe_redirect_uri("/home there")).toBe("/onboarding");
  });

  it("honours a caller's own fallback", () => {
    expect(safe_redirect_uri("https://evil.test", "/home")).toBe("/home");
  });
});
