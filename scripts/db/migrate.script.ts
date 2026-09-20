/**
 * Apply migrations using the runtime driver rather than drizzle-kit.
 *
 * `pnpm db:migrate` shells out to drizzle-kit, which is a devDependency and so
 * is absent from a pruned production image. This does the same job with only
 * `drizzle-orm` and `@neondatabase/serverless`, both of which are runtime
 * dependencies already.
 *
 * Run it as a ONE-SHOT step before rolling out new containers, never from the
 * image's entrypoint: replicas starting together would race, and the neon-http
 * driver has no transactions, so there is no lock to fall back on.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

await migrate(drizzle({ client: neon(url) }), {
  migrationsFolder: "./drizzle",
});

console.log("migrations applied");
