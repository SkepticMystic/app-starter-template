import { env } from "$env/dynamic/private";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { AuthModels } from "./auth.models";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = neon(env.DATABASE_URL);

export const db = drizzle(client, {
  casing: "snake_case",
  schema: {
    ...AuthModels,
    // Add other models here
  },
});
