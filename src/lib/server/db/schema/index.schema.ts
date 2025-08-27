import { timestamp } from "drizzle-orm/pg-core";

export const Schema = {
  timestamps: {
    createdAt: timestamp({ mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "date" }).defaultNow().notNull(),
  },
};
