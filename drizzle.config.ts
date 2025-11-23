import { defineConfig } from "drizzle-kit";

import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  strict: true,
  dialect: "postgresql",
  casing: "snake_case",
  schema: "./src/lib/server/db/schema/*.models.ts",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
