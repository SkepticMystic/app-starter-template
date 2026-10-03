import ipaddr from "ipaddr.js";
import dns from "node:dns/promises";
import { ERROR } from "#lib/const/error.const.js";
import { result } from "#lib/utils/result.util.js";

/**
 * Deciding whether a client-supplied URL is safe for the server to fetch or
 * POST to — the SSRF surface of anything that calls a URL a user typed
 * (webhooks, link previews, "import from URL"). Address classification is
 * `ipaddr.js`'s, which is byte-exact where string prefixes are known bypasses
 * and knows ranges (6to4, Teredo) that tunnel to a v4 address.
 *
 * Under `server/` because it imports `node:dns`; SvelteKit refuses it in a
 * client bundle.
 */

type UrlCheck = App.Result<{ url: URL; addresses: string[] }>;

/** Sanity bound; size a column holding a checked URL to match. */
const MAX_URL_LENGTH = 2048;

/**
 * Parses an address, refusing every non-canonical spelling. `ipaddr.parse` reads `010.0.0.1` as
 * octal `8.0.0.1` where other resolvers read decimal `10.0.0.1`; a value two parsers disagree
 * about must never reach the allow decision. An embedded v4 tail in a v6 address is held to the
 * same rule, since the library's v6 parser reads it as decimal.
 */
const parse_canonical = (
  address: string,
): ipaddr.IPv4 | ipaddr.IPv6 | undefined => {
  if (ipaddr.IPv4.isValidFourPartDecimal(address)) {
    return ipaddr.IPv4.parse(address);
  }

  if (!ipaddr.IPv6.isValid(address)) return undefined;

  // A dot in a v6 address is an embedded v4 tail. Strip the zone id (`%eth0`) first.
  const bare = address.split("%", 1)[0] ?? "";

  if (bare.includes(".")) {
    const tail = bare.slice(bare.lastIndexOf(":") + 1);

    if (!ipaddr.IPv4.isValidFourPartDecimal(tail)) return undefined;
  }

  return ipaddr.IPv6.parse(address);
};

/**
 * Whether an address is one we refuse to connect to. An allow-list of one value, `unicast`, so a
 * range the library learns about later is blocked on upgrade, and names absent from its published
 * union (`discard`) are refused too. An address that will not parse is refused.
 */
export const is_blocked_address = (address: string): boolean => {
  const parsed = parse_canonical(address);

  if (!parsed) return true;

  // Unwrap first, or `::ffff:169.254.169.254` classifies as `ipv4Mapped` rather than by its
  // embedded address.
  const resolved =
    parsed.kind() === "ipv6" && (parsed as ipaddr.IPv6).isIPv4MappedAddress()
      ? (parsed as ipaddr.IPv6).toIPv4Address()
      : parsed;

  return resolved.range() !== "unicast";
};

/**
 * Hostnames refused by name, before resolution — split-horizon or container DNS can point them
 * anywhere.
 */
export const is_blocked_hostname = (hostname: string): boolean => {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    // Kubernetes and Docker service discovery.
    host.endsWith(".cluster.local") ||
    host.endsWith(".svc")
  );
};

/**
 * Everything decidable from the URL text alone, so a form can reject a bad URL
 * without a network round trip.
 */
export const check_url_shape = (
  raw: string,
  options: { allow_http: boolean },
): App.Result<{ url: URL }> => {
  if (raw.length > MAX_URL_LENGTH) {
    return result.err({
      ...ERROR.INVALID_INPUT,
      message: "URL is too long",
    });
  }

  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    return result.err({
      ...ERROR.INVALID_INPUT,
      message: "Not a valid URL",
    });
  }

  if (
    url.protocol !== "https:" &&
    !(options.allow_http && url.protocol === "http:")
  ) {
    return result.err({
      ...ERROR.INVALID_INPUT,
      message: options.allow_http
        ? "URL must use http or https"
        : "URL must use https",
    });
  }

  // Credentials would be resent on every retry and stored in plaintext; clients use a header or
  // a path token.
  if (url.username || url.password) {
    return result.err({
      ...ERROR.INVALID_INPUT,
      message: "URL must not contain credentials",
    });
  }

  if (is_blocked_hostname(url.hostname)) {
    return result.err({
      ...ERROR.INVALID_INPUT,
      message: "URL host is not routable on the public internet",
    });
  }

  return result.suc({ url });
};

/** Matches `dns.lookup(host, { all: true })`; injectable so tests can resolve privately. */
export type Lookup = (
  hostname: string,
) => Promise<{ address: string; family: number }[]>;

/** `all: true` is load-bearing: without it Node returns only one address. */
const dns_lookup: Lookup = async (hostname) =>
  dns.lookup(hostname, { all: true });

/**
 * The full check: shape, then every address the hostname resolves to, not just
 * the first. A resolution failure is a refusal.
 *
 * DNS rebinding is not closed: `fetch` resolves again, and a short TTL can
 * answer differently. Closing it needs the socket pinned to a vetted address
 * or an egress proxy. Fetch with `redirect: "manual"` to close the easier
 * variant — a vetted host redirecting to a private one.
 */
export const check_url = async (
  raw: string,
  options: { allow_http: boolean; lookup?: Lookup },
): Promise<UrlCheck> => {
  const lookup = options.lookup ?? dns_lookup;
  const shape = check_url_shape(raw, options);

  if (!shape.ok) return shape;

  let resolved: { address: string; family: number }[];

  try {
    resolved = await lookup(shape.data.url.hostname);
  } catch {
    return result.err({
      ...ERROR.INVALID_INPUT,
      message: "URL host could not be resolved",
    });
  }

  if (resolved.length === 0) {
    return result.err({
      ...ERROR.INVALID_INPUT,
      message: "URL host could not be resolved",
    });
  }

  const blocked = resolved.find((entry) => is_blocked_address(entry.address));

  if (blocked) {
    return result.err({
      ...ERROR.INVALID_INPUT,
      message: "URL host resolves to an address that is not publicly routable",
    });
  }

  return result.suc({
    url: shape.data.url,
    addresses: resolved.map((entry) => entry.address),
  });
};
