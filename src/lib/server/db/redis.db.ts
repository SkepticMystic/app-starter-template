import {
  UPSTASH_KV_REST_API_URL,
  UPSTASH_KV_REST_API_TOKEN,
} from "$env/static/private";
import { Redis } from "@upstash/redis";

// NOTE: Starts connecting immediately
const redis = UPSTASH_KV_REST_API_URL
  ? new Redis({
      url: UPSTASH_KV_REST_API_URL,
      token: UPSTASH_KV_REST_API_TOKEN,
    })
  : null;

export { redis };
