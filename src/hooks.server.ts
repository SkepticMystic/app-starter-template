import { building } from "$app/environment";
import { MONGO_URI } from "$env/static/private";
import { auth } from "$lib/auth"; // path to your auth file
import { svelteKitHandler } from "better-auth/svelte-kit";
import mongoose from "mongoose";
import z from "zod";

const config = z.object({ MONGO_URI: z.string() }).parse({ MONGO_URI });

// DB
mongoose
  .connect(config.MONGO_URI)
  .catch((e) => console.log("mongoose.connect error", e));

// Middleware
export async function handle({ event, resolve }) {
  return svelteKitHandler({ event, resolve, auth, building });
}
