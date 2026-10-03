import { getRequestEvent } from "$app/server";
import { Log } from "#lib/utils/logger.util.js";
import { waitUntil } from "@vercel/functions";

const log = Log.child({ service: "adapter" });

/**
 * The platform seam. Everything this app reads from — or asks of — the host
 * platform is resolved here: client IP, coarse geo, and scheduling work that
 * outlives the response. Moving between Vercel and a plain Node server should
 * be a change to this file and nothing else.
 */

/**
 * Coarse request geo. A subset of Vercel's `Geo`, and a superset of the shape
 * `@upstash/ratelimit` accepts for analytics.
 */
type Geo = {
  country?: string;
  region?: string;
  city?: string;
};

const get_ip = () => {
  const event = getRequestEvent();

  return (
    event.getClientAddress() ||
    event.request.headers.get("cf-connecting-ip") ||
    event.request.headers.get("x-forwarded-for")?.split(",")[0] ||
    event.request.headers.get("x-real-ip") ||
    null
  );
};

/**
 * NOTE: these headers are only meaningful when a proxy we control sets them.
 * Nothing off Vercel strips an inbound `x-vercel-ip-country`, so a client can
 * pick its own country here. That is the trust level `get_ip`'s header
 * fallbacks already have, and these values feed only `session.country` and
 * rate-limit analytics. Do not promote them to an authorization decision.
 */
const get_geo = (): Geo => {
  const { headers } = getRequestEvent().request;

  const first = (...names: string[]) => {
    for (const name of names) {
      const value = headers.get(name);
      if (value) return value;
    }
    return undefined;
  };

  // Vercel percent-encodes the city so multi-byte names survive as a header.
  const city = first("x-vercel-ip-city");

  return {
    country: first("x-vercel-ip-country", "cf-ipcountry"),
    // ISO 3166-2 subdivision. Vercel's own `geolocation()` puts its *compute*
    // region (cpt1, iad1) in `region` and the subdivision in `countryRegion`.
    // There is no compute region off Vercel, so `region` means the subdivision
    // everywhere — which is what the consumers actually wanted.
    region: first("x-vercel-ip-country-region"),
    city: city ? decodeURIComponent(city) : undefined,
  };
};

/**
 * The header Better-Auth reads the client IP from (`advanced.ipAddress`).
 *
 * Better-Auth resolves the IP itself from request headers, not through
 * `getClientAddress()`, so `ADDRESS_HEADER`/`XFF_DEPTH` never reach it. Left on
 * its default it reads `x-forwarded-for` and trusts it only when it holds a
 * single address — fine on Vercel, which overwrites it, but behind any proxy
 * that appends, it resolves nothing and its rate limiter falls back to one
 * bucket shared by every caller.
 *
 * Naming a header the proxy happens to set (`cf-connecting-ip`,
 * `fly-client-ip`) would tie the app to one host and let any client that
 * reaches the origin directly pick its own bucket. Instead {@link pin_client_ip}
 * overwrites this one on every request with what SvelteKit resolved, so the
 * two can never disagree and nothing a client sends survives.
 */
const CLIENT_IP_HEADER = "x-app-client-ip";

/**
 * Stamps SvelteKit's view of the client address onto the request for
 * Better-Auth to read. Called first thing in `handle`, before anything reads
 * the headers. A client-sent value is always deleted, even when the address
 * cannot be resolved.
 */
const pin_client_ip = (event: {
  request: Request;
  getClientAddress: () => string;
}): void => {
  const { headers } = event.request;
  headers.delete(CLIENT_IP_HEADER);

  try {
    const ip = event.getClientAddress();
    if (ip) headers.set(CLIENT_IP_HEADER, ip);
  } catch (error) {
    // Prerendering has no client; Better-Auth falls back on its own.
    log.debug(error, "pin_client_ip.unresolved");
  }
};

const get_user_agent = () => {
  const event = getRequestEvent();

  return event.request.headers.get("user-agent") || null;
};

/**
 * Keeps the host alive until `promise` settles. Call `RuntimeService.defer`,
 * not this: it supervises the work and tracks it for the shutdown drain, and
 * calls this for the part only the host can do.
 *
 * On Vercel, `waitUntil` registers it with the request context so the function
 * is not frozen before it settles. Off Vercel `waitUntil` finds no context on
 * `globalThis` and is a silent no-op — the process outlives the response, and
 * `RuntimeService.drain` covers a graceful stop.
 *
 * `promise` must not reject: with no platform handler nothing else would
 * catch it, and Node's default `--unhandled-rejections=throw` would take the
 * server down. `RuntimeService.defer` only ever passes a supervised one.
 */
const wait_until = (promise: Promise<unknown>): void => {
  waitUntil(promise);
};

export const AdapterService = {
  CLIENT_IP_HEADER,
  pin_client_ip,
  get_ip,
  get_geo,
  get_user_agent,
  wait_until,
};
