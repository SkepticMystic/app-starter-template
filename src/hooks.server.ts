import { building } from "$app/environment";
import { MONGO_URL } from "$env/static/private";
import { auth } from "$lib/auth";
import type { ServerInit } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import mongoose from "mongoose";
import z from "zod";

const config = z.object({ MONGO_URL: z.string() }).parse({ MONGO_URL });

export const init: ServerInit = async () => {
  // DB
  mongoose
    .connect(config.MONGO_URL)
    .catch((e) => console.log("mongoose.connect error", e));
};

// Middleware
export async function handle({ event, resolve }) {
  return svelteKitHandler({ event, resolve, auth, building });
}
