import { REDIS_URL } from "$env/static/private";
import { APP } from "$lib/const/app";
import { Log } from "$lib/utils/logger.util";
import { Redis } from "ioredis";
import z from "zod";

const config = z
  .object({ REDIS_URL: z.string().optional() })
  .parse({ REDIS_URL });

// NOTE: Starts connecting immediately
const redis = config.REDIS_URL
  ? new Redis(config.REDIS_URL, {
      connectTimeout: 10_000,
      keyPrefix: APP.ID + ":",
    })
  : null;

redis
  ?.on("connect", () => Log.info("Redis client connected"))
  ?.on("error", (err) => Log.error(err, "Redis client error"));

export { redis };
