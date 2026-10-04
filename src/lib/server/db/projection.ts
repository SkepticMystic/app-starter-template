import type { InferSelectModel, Simplify, Table } from "drizzle-orm";

/**
 * The columns a query answers with, chosen by its caller. Inclusion only, so
 * the row is exactly what was named.
 */
export type Columns<T extends Table> = {
  [K in keyof InferSelectModel<T>]?: true;
};

/**
 * Rejects `{}`: drizzle reads an empty `columns` as "every column", the very
 * thing naming them is meant to prevent.
 */
export type NonEmpty<C> = keyof C extends never ? never : C;

/**
 * `columns` as drizzle must be shown it inside a generic query: it cannot
 * infer through a type parameter, so it is handed every column and the
 * query's declared {@link Projected} return narrows the row back.
 */
export type Every<T extends Table> = {
  [K in keyof InferSelectModel<T>]: true;
};

/** The row a query answers with for columns `C`. */
export type Projected<T extends Table, C> = Simplify<
  Pick<InferSelectModel<T>, keyof C & keyof InferSelectModel<T>>
>;
