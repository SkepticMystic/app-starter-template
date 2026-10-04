import { describe, expect, it } from "vite-plus/test";
import { chord_label, is_apple_keyboard } from "./keyboard.util.js";

describe("is_apple_keyboard", () => {
  it.each([
    [{ userAgentData: { platform: "macOS" } }],
    [{ platform: "MacIntel" }],
    [{ platform: "iPhone" }],
    [{ userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)" }],
    [{ userAgentData: { platform: "" }, platform: "MacIntel" }],
  ])("is true for %o", (nav) => {
    expect(is_apple_keyboard(nav)).toBe(true);
  });

  it.each([
    [{ userAgentData: { platform: "Windows" }, platform: "Win32" }],
    [{ platform: "Linux x86_64" }],
    [{ userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)" }],
    [{}],
  ])("is false for %o", (nav) => {
    expect(is_apple_keyboard(nav)).toBe(false);
  });
});

describe("chord_label", () => {
  it.each([
    [{ mod: true, key: "Z" }, false, "Ctrl+Z"],
    [{ mod: true, shift: true, key: "Z" }, false, "Ctrl+Shift+Z"],
    [{ mod: true, key: "Z" }, true, "⌘Z"],
    [{ mod: true, shift: true, key: "Z" }, true, "⇧⌘Z"],
    [{ key: "N" }, true, "N"],
    [{ key: "N" }, false, "N"],
  ])("writes %o (apple: %s) as %s", (chord, apple, label) => {
    expect(chord_label(chord, apple)).toBe(label);
  });
});
