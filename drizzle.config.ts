import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  strict: true,

  dialect: "postgresql",
  // drizzle-kit loads these through jiti, which reads `package.json#imports`,
  // so a model may import `#lib/….js` like any other module.
  schema: "./src/lib/server/db/models/*.model.ts",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
