/**
 * Whether this keyboard has ⌘ where others have Ctrl: a Mac, or an iPad or iPhone with one
 * attached (iPadOS reports itself as a Mac). Labels only — handlers should take Cmd or Ctrl alike,
 * as the sidebar's shortcut does.
 */
export const is_apple_keyboard = (nav: {
  platform?: string;
  userAgent?: string;
  userAgentData?: { platform?: string };
}): boolean => {
  // `||`, not `??`: an empty platform is no answer, so fall through to the next.
  const platform =
    nav.userAgentData?.platform || nav.platform || nav.userAgent || "";

  return /mac|iphone|ipad|ipod/i.test(platform);
};

/** The key a handler reads as `meta || ctrl`, as this keyboard labels it. */
const mod_label = (apple: boolean): string => (apple ? "⌘" : "Ctrl");

/** A chord as this platform writes it: `⇧⌘Z` on Apple, `Ctrl+Shift+Z` elsewhere. */
export const chord_label = (
  chord: { mod?: boolean; shift?: boolean; key: string },
  apple: boolean,
): string => {
  const mod = chord.mod === true ? mod_label(apple) : null;

  if (apple) {
    // Apple's order is Shift before Command, and nothing joins them.
    return `${chord.shift === true ? "⇧" : ""}${mod ?? ""}${chord.key}`;
  }

  return [mod, chord.shift === true ? "Shift" : null, chord.key]
    .filter((part) => part !== null)
    .join("+");
};
