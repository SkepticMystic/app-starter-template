import { db } from "$lib/server/db/drizzle.db";
import { ImageTable, type Image } from "$lib/server/db/models/image.model";
import { eq } from "drizzle-orm";
import { Repo } from "./index.repo";

const create = async (input: typeof ImageTable.$inferInsert) => {
  return Repo.insert_one(db.insert(ImageTable).values(input).returning());
};

const update = async (
  image_id: string,
  update: Partial<typeof ImageTable.$inferInsert>,
): Promise<App.Result<Image>> =>
  Repo.update_one(
    db
      .update(ImageTable)
      .set(update)
      .where(eq(ImageTable.id, image_id))
      .returning(),
  );

export const ImageRepo = {
  create,
  update,
};
