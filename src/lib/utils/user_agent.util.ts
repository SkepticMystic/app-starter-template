/**
 * "Firefox on macOS" from a User-Agent, for a person telling their own
 * sessions apart — not for analytics or anything that decides access. Order
 * matters: Edge and Opera also claim Chrome, and Chrome also claims Safari.
 */

const BROWSERS: readonly (readonly [RegExp, string])[] = [
  [/Edg(e|A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: readonly (readonly [RegExp, string])[] = [
  [/iPhone|iPad|iPod/, "iOS"],
  [/Android/, "Android"],
  [/CrOS/, "ChromeOS"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Windows/, "Windows"],
  [/Linux/, "Linux"],
];

const first = (ua: string, table: typeof BROWSERS) =>
  table.find(([pattern]) => pattern.test(ua))?.[1];

const describe = (ua: string | null | undefined): string => {
  if (!ua) return "Unknown device";

  const browser = first(ua, BROWSERS);
  const system = first(ua, SYSTEMS);

  if (browser && system) return `${browser} on ${system}`;

  return browser ?? system ?? "Unknown device";
};

export const UserAgentUtil = { describe };
