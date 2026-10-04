import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit always connects direct. `DATABASE_URL_UNPOOLED` is set where the
 * app's own URL goes through Neon's pgbouncer (`infra/app_env.tf`); without it,
 * a `-pooler` host is turned back into its direct twin, since push and migrate
 * need a session that transaction pooling does not give.
 */
const direct_url = () => {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  return url?.replace(/-pooler\./, ".");
};

export default defineConfig({
  out: "./drizzle",
  strict: true,

  dialect: "postgresql",
  // drizzle-kit loads these through jiti, which reads `package.json#imports`,
  // so a model may import `#lib/….js` like any other module.
  schema: "./src/lib/server/db/models/*.model.ts",
  dbCredentials: { url: direct_url()! },
});
