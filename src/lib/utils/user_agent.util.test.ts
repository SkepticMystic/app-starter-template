import { describe, expect, it } from "vite-plus/test";
import { UserAgentUtil } from "./user_agent.util.js";

describe("UserAgentUtil.describe", () => {
  it.each([
    [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
      "Safari on macOS",
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 Edg/126.0",
      "Edge on Windows",
    ],
    [
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
      "Chrome on Android",
    ],
    [
      "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
      "Firefox on Linux",
    ],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1",
      "Chrome on iOS",
    ],
  ])("names %s", (ua, expected) => {
    expect(UserAgentUtil.describe(ua)).toBe(expected);
  });

  it("falls back when there is nothing to read", () => {
    expect(UserAgentUtil.describe(null)).toBe("Unknown device");
    expect(UserAgentUtil.describe("curl/8.0")).toBe("Unknown device");
  });
});
