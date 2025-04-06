import { MONGO_URI } from "$env/static/private";
import { auth } from "$lib/auth/lucia";
import type { Handle } from "@sveltejs/kit";
import mongoose from "mongoose";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.auth = auth.handleRequest(event);
  return await resolve(event);
};

mongoose
  .connect(MONGO_URI, { autoIndex: false, dbName: "generic-app" })
  .catch((e) => console.log("mongoose.connect error", e));
