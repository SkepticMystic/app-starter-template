import { describe, expect, it } from "vite-plus/test";
import { estimate_password_strength } from "./password_strength.util";

describe("estimate_password_strength", () => {
  it.each([
    ["empty", ""],
    ["under the minimum length", "aB3$xY9"],
    ["a common base", "Password1"],
    ["a keyboard walk", "qwertyuiop"],
    ["a run", "abcdefghij"],
    ["one repeated character", "aaaaaaaaaaaa"],
  ])("scores %s as weak", (_, password) => {
    expect(estimate_password_strength(password)).toBeLessThan(2);
  });

  it.each([
    ["mixed classes", "aB3$xY9!"],
    ["a passphrase", "correct-Horse-battery-staple"],
    ["a long lowercase passphrase", "correcthorsebatterystaple"],
  ])("scores %s as acceptable", (_, password) => {
    expect(estimate_password_strength(password)).toBeGreaterThanOrEqual(2);
  });

  it("tops out at 4", () => {
    expect(estimate_password_strength("correct-Horse-battery-staple")).toBe(4);
  });
});
