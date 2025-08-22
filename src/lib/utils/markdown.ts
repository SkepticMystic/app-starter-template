import Turndown from "turndown";
import { Json } from "./json";

const turndown = new Turndown();

export const Markdown = {
  codeblock: (code: unknown) =>
    `\n\`\`\`\n${Json.str_or_stringify(code)}\n\`\`\`\n`,

  from_html: (html: string) => turndown.turndown(html),
};
