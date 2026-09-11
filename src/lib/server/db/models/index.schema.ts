import { getColumns } from "drizzle-orm";
import type { PgTable, PgUpdateSetSource } from "drizzle-orm/pg-core";
import { timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * The column patch produced by {@link Schema.patcher}: the picked subset of
 * what drizzle will accept in a `.set()` for this table.
 *
 * Taken from drizzle's own update shape rather than derived from the input,
 * because whether a key may be `null` is a property of the COLUMN, not of the
 * input — `title` is NOT NULL and is omitted when empty, while `description` is
 * nullable and is cleared. Only the table knows which is which.
 */
type Patched<T extends PgTable, P extends string> = Pick<
  PgUpdateSetSource<T>,
  Extract<P, keyof PgUpdateSetSource<T>>
>;

export const Schema = {
  id: () => ({
    id: uuid().primaryKey().defaultRandom(),
  }),

  timestamps: {
    createdAt: timestamp({ mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },

  /**
   * Builds the function that turns validated form input into a column patch,
   * bound to one table and one `pick`.
   *
   * It exists for a class of bug that types do not catch: a field is picked by
   * the schema, posted by the form, validated on the way in — and then dropped,
   * because the service's object literal never mentioned it. The save reports
   * success and the column never moves. A patch missing a key is a legal patch,
   * so nothing complains.
   *
   * Three rules, all load-bearing:
   *
   * 1. The `pick` is the allowlist, enforced here as well as by the schema.
   *    Nothing outside it is read, so a payload carrying a status column cannot
   *    write one however the service is called.
   * 2. `undefined` on a NULLABLE column becomes `NULL` — the field was
   *    submitted empty. This is the case drizzle gets wrong for us: `.set()`
   *    skips `undefined` keys, so passing one through means "keep the old
   *    value", and clearing a `<select>` back to blank silently appears not to
   *    work.
   * 3. `undefined` on a NOT NULL column omits the key — leaving the column
   *    alone on an update, and taking its default on an insert.
   *
   * Rule 2 reads *empty* as *clear*, which is only sound because these forms
   * post whole: every `*Schema.update` keeps its NOT NULL columns required, so
   * a sparse payload fails validation before it reaches here. A caller wanting
   * true patch semantics must not use this.
   *
   * Reading the `pick` rather than the input's own keys also keeps the
   * behaviour off a Zod detail — a schema that strips unknown keys and one that
   * passes them through behave identically through this.
   */
  patcher: <T extends PgTable, P extends string>(
    table: T,
    pick: Record<P, true>,
  ) => {
    // Resolved once at import; `getColumns` walks the table definition.
    const columns = getColumns(table);
    const keys = Object.keys(pick) as P[];

    return (input: Partial<Record<P, unknown>>) => {
      const patch: Record<string, unknown> = {};

      for (const key of keys) {
        const value = input[key];

        if (value !== undefined) {
          patch[key] = value;
          continue;
        }

        // Submitted empty: clear it if the column can hold NULL, otherwise
        // leave the key out entirely.
        const column = columns[key];
        if (column && !column.notNull) patch[key] = null;
      }

      return patch as Patched<T, P>;
    };
  },
};
