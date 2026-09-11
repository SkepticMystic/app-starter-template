import {
  APP_ENV,
  UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_REST_URL,
} from "$app/env/private";
import { APP } from "$lib/const/app.const";
import { Redis } from "@upstash/redis";

// NOTE: Starts connecting immediately
const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL,
  token: UPSTASH_REDIS_REST_TOKEN,
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
 * - `APP_ENV` separates prod / preview / development from each other.
 *   Without it a local dev run shares production's sessions and rate-limit
 *   buckets, so a dev loop can exhaust a production limit.
 *
 * `APP_ENV` was `VERCEL_ENV`, imported from `$env/static/private` so that a
 * missing value failed the BUILD. A container image is built once and run
 * against three tiers, so a build-time guarantee no longer covers the case
 * that matters. The guarantee moved rather than went away: `src/env.ts`
 * declares `APP_ENV` with a zod enum, Kit validates it inside `Server.init()`,
 * and adapter-node top-level-awaits that — so a missing or misspelled value
 * exits the process before the port is bound. A container with a bad `APP_ENV`
 * never serves a request.
 *
 * The VALUES are frozen. Changing one does not migrate a keyspace, it abandons
 * one: sessions are Redis-only (`storeSessionInDatabase: false` in
 * `src/lib/auth.ts`), so a changed prefix is an instant, total logout, plus
 * every pending verification, reset and invite link. `infra/upstash.tf` sets
 * `eviction = false`, so the orphaned keys are not evicted either — they sit
 * consuming a shared quota until their TTLs expire, and a full instance fails
 * writes for every other project on it.
 */
export const REDIS_PREFIX = `${APP.ID}:${APP_ENV}`;

export { redis };
