import { getRequestEvent } from "$app/server";
import { Log } from "$lib/utils/logger.util";
import { captureException } from "@sentry/sveltekit";
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

const get_user_agent = () => {
  const event = getRequestEvent();

  return event.request.headers.get("user-agent") || null;
};

/**
 * Run `promise` without making the response wait for it.
 *
 * On Vercel, `waitUntil` registers it with the request context so the function
 * is not frozen before it settles. Off Vercel `waitUntil` finds no context on
 * `globalThis` and is a silent no-op — which is fine on a long-lived Node
 * server, because the process outlives the response and the promise simply
 * keeps running on the event loop.
 *
 * The `.catch` is what makes that safe. With no platform handler the promise is
 * unsupervised, and Node's default `--unhandled-rejections=throw` would take
 * the whole server down on a rejection. Better-Auth's `runInBackground` hands
 * its handler a raw, uncaught promise, so this is load-bearing there too.
 */
const wait_until = (promise: Promise<unknown>): void => {
  waitUntil(
    promise.catch((error: unknown) => {
      log.error(error, "background_task_failed");
      captureException(error);
    }),
  );
};

export const AdapterService = {
  get_ip,
  get_geo,
  get_user_agent,
  wait_until,
};
