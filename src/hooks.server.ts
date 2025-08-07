import { MONGO_URI } from "$env/static/private";
import { auth } from "$lib/auth/lucia";
import type { Handle } from "@sveltejs/kit";
import mongoose from "mongoose";
import z from "zod";

const config = z.object({ MONGO_URI: z.string() }).parse({ MONGO_URI });

// DB
mongoose
  .connect(config.MONGO_URI, { autoIndex: false, dbName: "generic-app" })
  .catch((e) => console.log("mongoose.connect error", e));

// Middleware
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.auth = auth.handleRequest(event);
  return await resolve(event);
};
