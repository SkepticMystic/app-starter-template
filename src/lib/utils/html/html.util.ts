import type { Branded } from "#lib/interfaces/zod/zod.type.js";
import { sanitize as purify } from "isomorphic-dompurify";

export const HTMLUtil = {
  /**
   * Strips dangerous markup from HTML that is already assembled, such as rendered markdown.
   *
   * NOT for protecting the values interpolated into markup you wrote — let Svelte's `{value}`
   * escape those. Sanitising the finished string answers the wrong question: DOMPurify removes
   * `onerror` and `javascript:`, but it permits ordinary markup from any interpolated value, so
   * a display name of `<b>x</b>` still arrives bold, and it rewrites legitimate text containing
   * `&`.
   *
   * Loads jsdom (~310ms) on the server, so keep this module off any path that does not need it.
   */
  sanitize: (dirty: string) => purify(dirty) as Branded<"SanitizedHTML">,
};
