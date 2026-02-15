import type { Branded } from "$lib/interfaces/branded.interface";
import { marked } from "marked";

/**
 * Converts markdown to HTML with GitHub Flavored Markdown
 * Returns a branded type for XSS safety
 */
export const Markdown = {
  to_html: (markdown: string): Branded<string, "PrerenderedHTML"> => {
    const html = marked.parse(markdown, {
      gfm: true, // GitHub Flavored Markdown
      async: false,
      breaks: true, // Convert \n to <br>
    }) as string;

    return html as Branded<string, "PrerenderedHTML">;
  },
};
