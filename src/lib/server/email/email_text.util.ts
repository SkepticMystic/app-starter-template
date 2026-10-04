const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const decode = (value: string) =>
  value.replaceAll(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (!entity.startsWith("#")) return NAMED[entity.toLowerCase()] ?? match;

    const code = /^#x/i.test(entity)
      ? Number.parseInt(entity.slice(2), 16)
      : Number(entity.slice(1));

    return Number.isFinite(code) ? String.fromCodePoint(code) : match;
  });

const strip_tags = (html: string) => html.replaceAll(/<[^>]+>/g, "");

/** A button gets its own "Label: url" line; an inline link keeps its sentence. */
const link = (anchor: string) => {
  const open = /^<a\b[^>]*>/i.exec(anchor)?.[0] ?? "";
  const href = /\bhref="([^"]*)"/.exec(open)?.[1];
  const label = strip_tags(anchor).trim();
  if (!href) return label;
  if (!label || label === href) return href;

  return /\bdata-button\b/.test(open)
    ? `${label}: ${href}`
    : `${label} (${href})`;
};

/**
 * The plain-text part of an email, from its rendered body.
 *
 * Not a general HTML-to-text converter: it reads the markup the primitives in `./primitives`
 * write, and two markers they set. `data-text-skip` drops an element (it must not nest an
 * element of its own tag); `data-label` makes a table cell read "Label: value".
 */
const from_html = (html: string): string =>
  decode(
    strip_tags(
      html
        .replaceAll(/<!--[\s\S]*?-->/g, "")
        .replaceAll(/<(\w+)\b[^>]*\bdata-text-skip\b[^>]*>[\s\S]*?<\/\1>/gi, "")
        // HTML's own whitespace rule, before line breaks are added back.
        .replaceAll(/\s+/g, " ")
        .replaceAll(
          /<td\b[^>]*\bdata-label\b[^>]*>([\s\S]*?)<\/td>/gi,
          (_, label: string) => `${strip_tags(label).trim()}: `,
        )
        .replaceAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi, link)
        .replaceAll(/<br\s*\/?>/gi, "\n")
        .replaceAll(/<\/tr>/gi, "\n")
        .replaceAll(/<\/(p|h[1-6]|table|div|li)>/gi, "\n\n"),
    ),
  )
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();

export const EmailText = { from_html };
