import { APP_ENV } from "$env/static/private";
import { env } from "$env/dynamic/private";
import { APP } from "$lib/const/app.const";
import { Redis } from "@upstash/redis";

// NOTE: Starts connecting immediately
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Namespace for every Redis key this app writes. Prepend it — nothing should
 * talk to `redis` with a bare key.
 *
 * One Upstash instance is typically shared by all tiers AND by other projects
 * (see `infra/upstash.tf`), and this prefix is the only thing keeping them
 * apart: unlike the database (a Neon branch per tier) and object storage (a
 * bucket per tier), there is no separation underneath. Both segments are
 * load-bearing:
 *
 * - `APP.ID` separates this app from the others on the instance.
 * - `APP_ENV` separates prod / preview / development from each other. Without
 *   it a local dev run shares production's sessions and rate-limit buckets, so
 *   a dev loop can exhaust a production limit.
 *
 * This used to be `VERCEL_ENV`, auto-injected by Vercel. It is now written
 * explicitly per tier by `infra/`, with the SAME three values
 * (`production` / `preview` / `development`) — the prefix string is unchanged
 * by that rename, so no keys were orphaned and no sessions were dropped. Do not
 * "tidy" these values into `prod`/`dev`: that silently moves every session and
 * rate-limit bucket to a new keyspace.
 *
 * It stays a `$env/static/private` import while the rest of this file has moved
 * to `$env/dynamic/private`. That is deliberate: a missing value fails the
 * build outright, which is what we want. A runtime fallback would quietly
 * default production into some other tier's keyspace.
 */
export const REDIS_PREFIX = `${APP.ID}:${APP_ENV}`;

export { redis };
