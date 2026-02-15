import { DATABASE_URL } from "$env/static/private";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { relations } from "./relations";
import { schema } from "./schema";

const client = neon(DATABASE_URL);

export const db = drizzle({
	client,
	casing: "snake_case",
	schema,
	relations,
});
