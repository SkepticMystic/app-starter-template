// SOURCE: https://stackoverflow.com/questions/1053902/how-to-convert-a-title-to-a-url-slug-in-jquery
const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");

/**
 * `ross@example.com` -> `r••s@example.com`.
 *
 * For showing somebody an address that is not theirs. The domain is kept
 * because "that is my work address" is usually the whole message, and the first
 * and last characters because they are what makes it recognisable to its owner
 * without being enough to guess.
 */
const mask_email = (email: string) => {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "•••";

  const local = email.slice(0, at);
  const domain = email.slice(at);

  if (local.length <= 2) return `${local[0] ?? ""}•${domain}`;

  return `${local[0]}${"•".repeat(Math.min(local.length - 2, 5))}${local.at(-1)}${domain}`;
};

/** `count === 1 ? str : plural`.
 *
 * `plural` is explicit because the `+ "s"` rule is what stopped this being used
 * at all — "deliveries", "entries", "tries" — so call sites hand-rolled a
 * ternary instead, in several spellings, some of which rendered "0 item".
 */
const pluralize = (str: string, count: number, plural = `${str}s`) =>
  count === 1 ? str : plural;

/** `no-answer` -> `No answer`. Only the first letter is raised: these are
 * sentence fragments in prose, not headings. */
const humanise = (raw: string) =>
  raw.charAt(0).toUpperCase() + raw.slice(1).replaceAll(/[-_]/g, " ");

const collapse_whitespace = (value: string | undefined) =>
  value?.trim().replaceAll(/\s+/g, " ") || undefined;

export const Strings = {
  slugify,
  mask_email,
  pluralize,
  humanise,
  collapse_whitespace,
};
