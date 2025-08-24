import { building } from "$app/environment";
import { MONGO_URL } from "$env/static/private";
import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import mongoose from "mongoose";
import z from "zod";

const config = z.object({ MONGO_URL: z.string() }).parse({ MONGO_URL });

// DB
mongoose
  .connect(config.MONGO_URL)
  .catch((e) => console.log("mongoose.connect error", e));

// Middleware
export async function handle({ event, resolve }) {
  return svelteKitHandler({ event, resolve, auth, building });
}
