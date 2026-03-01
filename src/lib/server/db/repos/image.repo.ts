import { ERROR } from "$lib/const/error.const";
import { db } from "$lib/server/db/drizzle.db";
import { ImageTable, type Image } from "$lib/server/db/models/image.model";
import { result } from "$lib/utils/result.util";
import { and, count, eq } from "drizzle-orm";
import { Repo } from "./index.repo";

const build_image_where_clause = (
  input: Partial<Pick<Image, "id" | "resource_id" | "resource_kind">>,
  org_id: string,
) =>
  and(
    eq(ImageTable.org_id, org_id),

    input.id //
      ? eq(ImageTable.id, input.id)
      : undefined,
    input.resource_id
      ? eq(ImageTable.resource_id, input.resource_id)
      : undefined,
    input.resource_kind
      ? eq(ImageTable.resource_kind, input.resource_kind)
      : undefined,
  );

const create = async (input: typeof ImageTable.$inferInsert) => {
  return Repo.insert_one(db.insert(ImageTable).values(input).returning());
};

const count_images = async (
  input: Pick<Image, "resource_id" | "resource_kind">,
  org_id: string,
) => {
  const res = await Repo.query(
    db
      .select({ count: count(ImageTable.id) })
      .from(ImageTable)
      .where(build_image_where_clause(input, org_id))
      .groupBy(ImageTable.resource_id),
  );

  return res.ok
    ? result.suc(res.data[0]?.count ?? 0)
    : result.err(ERROR.INTERNAL_SERVER_ERROR);
};

const delete_many = async (
  input: Partial<Pick<Image, "id" | "resource_id" | "resource_kind">>,
  org_id: string,
) =>
  Repo.query(
    db
      .delete(ImageTable) //
      .where(build_image_where_clause(input, org_id))
      .returning(),
  );

const update_one = async (
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
  update_one,
  count: count_images,
  delete_many,
};
