import {
  UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_REST_URL,
  VERCEL_ENV,
} from "$env/static/private";
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
 * - `VERCEL_ENV` separates prod / preview / development from each other.
 *   Without it a local dev run shares production's sessions and rate-limit
 *   buckets, so a dev loop can exhaust a production limit.
 *
 * VERCEL_ENV is injected by Vercel on the deployed tiers and supplied locally
 * through `.env.local`. It is imported statically on purpose: if it is ever
 * missing the build fails outright, which is what we want. A runtime fallback
 * would quietly default production into some other tier's keyspace.
 */
export const REDIS_PREFIX = `${APP.ID}:${VERCEL_ENV}`;

export { redis };
