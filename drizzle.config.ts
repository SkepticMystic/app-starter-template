import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

export default defineConfig({
  strict: true,
  dialect: "postgresql",
  casing: "snake_case",
  schema: "./src/lib/server/db/schema/*.models.ts",
  dbCredentials: { url: process.env.DATABASE_URL },
});
