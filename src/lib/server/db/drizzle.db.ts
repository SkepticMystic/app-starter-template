import { DATABASE_URL } from "$env/static/private";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { relations } from "./relations";

const client = neon(DATABASE_URL);

/**
 * `schema` is no longer passed — drizzle v1 takes `relations` alone, and the
 * table-name casing that used to come from `drizzle.config.ts`'s
 * `casing: "snake_case"` now comes from declaring each table with
 * `snakeCase.table(...)` in the models.
 *
 * `jit` compiles a row mapper per query shape. It changes mapping only, never
 * the SQL that is sent.
 */
export const db = drizzle({ client, relations, jit: true });
