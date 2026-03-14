import { RESOURCE } from "$lib/const/resource/resource.const";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { IMAGE_HOSTING } from "../../../const/image/image_hosting.const";
import { MemberTable, OrganizationTable, UserTable } from "./auth.model";
import { Schema } from "./index.schema";

export const image_provider_enum = pgEnum(
  "image_providers",
  IMAGE_HOSTING.PROVIDER.IDS,
);

// NOTE: Use the same names as given to the drizzle.schema setup
export const image_resource_kind_enum = pgEnum(
  "image_resource_kind",
  RESOURCE.KINDS,
);

export const ImageTable = pgTable(
  "image",
  {
    ...Schema.id(),

    user_id: uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    org_id: uuid()
      .notNull()
      .references(() => OrganizationTable.id, { onDelete: "cascade" }),
    member_id: uuid()
      .notNull()
      .references(() => MemberTable.id, { onDelete: "cascade" }),

    // NOT unique! Many images for one resource
    resource_id: uuid().notNull(),
    resource_kind: image_resource_kind_enum().notNull(),

    url: varchar({ length: 2048 }).notNull(),
    provider: image_provider_enum().notNull(),
    external_id: varchar({ length: 255 }).notNull().unique(),

    size: integer().notNull(),
    width: integer().notNull(),
    height: integer().notNull(),

    thumbhash: varchar({ length: 100 }),

    ...Schema.timestamps,
  },
  (table) => [
    index("idx_image_user_id").on(table["user_id"]),
    index("idx_image_org_id").on(table["org_id"]),
    index("idx_image_member_id").on(table["member_id"]),
    // NOTE: I could make a compound index on (resource_id, resource_kind) but
    // the id is gonna be a unique uuid
    index("idx_image_resource_id").on(table["resource_id"]),
  ],
);

export type Image = typeof ImageTable.$inferSelect;

const pick = {
  resource_id: true,
  resource_kind: true,
} satisfies Partial<Record<keyof Image, true>>;

export const ImageSchema = {
  insert: createInsertSchema(ImageTable).pick(pick),
};
