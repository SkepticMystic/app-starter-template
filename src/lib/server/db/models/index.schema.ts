import { timestamp, uuid } from "drizzle-orm/pg-core";

export const Schema = {
  id: () => ({
    id: uuid().primaryKey().defaultRandom(),
  }),

  timestamps: {
    createdAt: timestamp({ mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "date" }).defaultNow().notNull(),
  },
};
