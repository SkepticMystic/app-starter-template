import type { Branded } from "$lib/interfaces/zod/zod.type";
import Purify from "isomorphic-dompurify";

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Marks a string as already-safe HTML, so {@link html} leaves it alone.
 *
 * A runtime class rather than the `Branded<"SanitizedHTML">` type, because that
 * brand is erased at compile time — a tagged template has no way to tell
 * "already-safe markup" from "a display name that happens to be typed loosely".
 * Only a runtime marker lets escaping be the default and the exception be
 * something the author has to write.
 */
class RawHtml {
  constructor(readonly value: string) {}
}

export const HTMLUtil = {
  /**
   * Strips dangerous markup from HTML that is already assembled.
   *
   * NOT for protecting the values interpolated into a template you wrote — use
   * {@link HTMLUtil.html} for that. Sanitising the finished string answers the
   * wrong question: DOMPurify removes `onerror` and `javascript:`, but it
   * permits ordinary markup from any interpolated value, so a display name of
   * `<b>x</b>` still arrives bold, and it rewrites legitimate text containing
   * `&`. The whole guarantee also rested on a default config that a later
   * change could loosen without any call site looking different.
   */
  sanitize: (dirty: string) =>
    Purify.sanitize(dirty) as Branded<"SanitizedHTML">,

  /** Escapes the five characters that would otherwise be read as markup. */
  escape: (value: unknown) =>
    String(value).replaceAll(/[&<>"']/g, (c) => ESCAPES[c] ?? c),

  /** Opts a value out of escaping. Only for markup this codebase wrote. */
  raw: (value: string) => new RawHtml(value),

  /**
   * Tagged template that escapes every substitution:
   *
   * ```ts
   * HTMLUtil.html`<p>Hi ${user.name}</p>`
   * ```
   *
   * The literal parts are trusted because they are written here; everything
   * interpolated is escaped unless wrapped in {@link HTMLUtil.raw}.
   */
  html: (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Branded<"SanitizedHTML"> =>
    strings.reduce<string>((acc, part, i) => {
      if (i === 0) return part;

      const value = values[i - 1];
      const rendered =
        value instanceof RawHtml
          ? value.value
          : String(value).replaceAll(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

      return acc + rendered + part;
    }, "") as Branded<"SanitizedHTML">,
};
