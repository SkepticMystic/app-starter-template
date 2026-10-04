import { HTMLUtil } from "#lib/utils/html/html.util.js";
import { marked } from "marked";

/** Markdown to HTML (GitHub Flavored), sanitized: `marked` passes raw HTML through untouched. */
export const Markdown = {
  to_html: (markdown: string) =>
    HTMLUtil.sanitize(
      marked.parse(markdown, {
        gfm: true,
        async: false,
        breaks: true, // Convert \n to <br>
      }),
    ),
};
