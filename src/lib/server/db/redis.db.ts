import {
  UPSTASH_KV_REST_API_TOKEN,
  UPSTASH_KV_REST_API_URL,
} from "$env/static/private";
import { Redis } from "@upstash/redis";

// NOTE: Starts connecting immediately
const redis = new Redis({
  url: UPSTASH_KV_REST_API_URL,
  token: UPSTASH_KV_REST_API_TOKEN,
});

export { redis };
