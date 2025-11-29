import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  strict: true,

  dialect: "postgresql",
  casing: "snake_case",
  schema: "./src/lib/server/db/models/*.model.ts",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
