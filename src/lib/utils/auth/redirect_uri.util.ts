/**
 * A same-origin path, and nothing else.
 *
 * The pattern rejects, in order:
 * - anything not starting with `/` — an absolute `https://evil.test` URL;
 * - `//evil.test`, which a browser reads as protocol-relative and follows
 *   off-origin;
 * - `/\evil.test`, which several browsers normalise to the same thing;
 * - any whitespace, because a newline in a `Location` header is a response
 *   splitting primitive, not just a malformed path;
 * - anything longer than {@link MAX_LENGTH}.
 *
 * It falls back to the default rather than raising a validation error on
 * purpose: the person holding the correct password is not the person to show a
 * form error to, and a tampered `redirect_uri` is not their doing. Landing them
 * on the default page is both safe and unremarkable.
 *
 * Plain, not zod, because the sign-in pages' universal loads run it in the
 * browser; `redirect_uri_schema` wraps it for the remotes.
 */
const PATH = /^\/(?![/\\])\S*$/;
const MAX_LENGTH = 2048;

export const safe_redirect_uri = (
  value: string | null | undefined,
  fallback = "/onboarding",
) =>
  value && value.length <= MAX_LENGTH && PATH.test(value) ? value : fallback;
