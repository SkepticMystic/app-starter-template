import { db } from "#lib/server/db/drizzle.db.js";
import { ImageTable } from "#lib/server/db/models/image.model.js";
import { Repo } from "./index.repo.js";

const create = async (input: typeof ImageTable.$inferInsert) =>
  Repo.insert_one(db.insert(ImageTable).values(input).returning());

export const ImageRepo = {
  create,
};
