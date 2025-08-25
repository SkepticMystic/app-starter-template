import { REDIS_URL } from "$env/static/private";
import { Redis } from "ioredis";
import z from "zod";

const config = z
  .object({ REDIS_URL: z.string().optional() })
  .parse({ REDIS_URL });

// NOTE: Starts connecting immediately
const redis = config.REDIS_URL
  ? new Redis(config.REDIS_URL, { connectTimeout: 10_000 })
  : null;

redis?.on("error", (err) => console.log("Redis Client Error", err));

export { redis };
