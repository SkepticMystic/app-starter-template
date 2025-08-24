import { building } from "$app/environment";
import { MONGO_URL, REDIS_URL } from "$env/static/private";
import { auth } from "$lib/auth"; // path to your auth file
import { svelteKitHandler } from "better-auth/svelte-kit";
import mongoose from "mongoose";
import { createClient } from "redis";
import z from "zod";

const config = z.object({ MONGO_URL: z.string() }).parse({ MONGO_URL });

// DB
mongoose
  .connect(config.MONGO_URL)
  .catch((e) => console.log("mongoose.connect error", e));

const redis = createClient({ url: REDIS_URL });

redis.on("error", (err) => console.log("Redis Client Error", err));

await redis.connect();

export { redis };

// Middleware
export async function handle({ event, resolve }) {
  return svelteKitHandler({ event, resolve, auth, building });
}
