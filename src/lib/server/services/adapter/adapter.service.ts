import { getRequestEvent } from "$app/server";

/**
 * The same keys `@vercel/functions`' `geolocation()` returned, deliberately.
 * `src/lib/auth.ts` writes `.country` onto every session row and
 * `rate_limit.service.ts` hands the whole object to Upstash analytics, so
 * these names are an external contract — which is why they are camelCase
 * against house style rather than `snake_case`.
 */
type Geo = {
  city?: string;
  country?: string;
  countryRegion?: string;
  region?: string;
  latitude?: string;
  longitude?: string;
  postalCode?: string;
};

const header = (name: string) => {
  const value = getRequestEvent().request.headers.get(name)?.trim();

  return value || undefined;
};

/**
 * Cloudflare placeholders, neither of which is a country. `XX` means unknown
 * and `T1` means a Tor exit node. Writing either into `session.country` would
 * put a value that looks like an ISO code but is not into every analytics
 * query that groups by it.
 */
const NOT_A_COUNTRY = new Set(["XX", "T1"]);

/**
 * `cf-ipcountry` is present on every Cloudflare plan. Everything else comes
 * from the "Add visitor location headers" managed transform, which is OFF by
 * default — so every other field is optional and none may be assumed present.
 *
 * Behaviour when the headers are absent matches what `geolocation()` did off
 * Vercel: empty fields rather than a throw, so a request that reaches the
 * container without traversing Cloudflare still works.
 *
 * `region` carries Cloudflare's subdivision name rather than Vercel's edge
 * region, which no longer exists. Only Upstash analytics reads it.
 */
const get_geo = (): Geo => {
  const country = header("cf-ipcountry");

  return {
    country: country && !NOT_A_COUNTRY.has(country) ? country : undefined,
    // Cloudflare percent-encodes non-ASCII city names.
    city: header("cf-ipcity"),
    region: header("cf-region"),
    countryRegion: header("cf-region-code"),
    latitude: header("cf-iplatitude"),
    longitude: header("cf-iplongitude"),
    postalCode: header("cf-postal-code"),
  };
};

/**
 * `getClientAddress()` THROWS on adapter-node when the configured
 * `ADDRESS_HEADER` is absent from the request — which is true of anything that
 * reaches the container without passing through the reverse proxy, such as the
 * container healthcheck or a direct probe. Every rate-limited path calls this,
 * so an uncaught throw would turn a rate-limit decision into a 500.
 *
 * Order is trust order. `getClientAddress()` reads the header the proxy
 * computed from Cloudflare's `Cf-Connecting-Ip` under `trusted_proxies`, and
 * is authoritative. `cf-connecting-ip` is the same value by another route and
 * is overwritten by the proxy, so it cannot be forged from outside. The
 * leftmost `x-forwarded-for` entry is the opposite — it is whatever the client
 * typed — and is therefore last.
 */
const get_ip = (): string | null => {
  let address: string | null;

  try {
    address = getRequestEvent().getClientAddress() || null;
  } catch {
    address = null;
  }

  return (
    address ||
    header("cf-connecting-ip") ||
    header("x-real-ip") ||
    header("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  );
};

const get_user_agent = () => header("user-agent") ?? null;

export const AdapterService = {
  get_ip,
  get_geo,
  get_user_agent,
};
