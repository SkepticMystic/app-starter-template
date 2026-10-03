import { describe, expect, it } from "vite-plus/test";
import { integer, text, uuid } from "drizzle-orm/pg-core";
import { snakeCase } from "drizzle-orm/pg-core/casing";
import { Schema } from "./index.schema";

const Table = snakeCase.table("patcher_fixture", {
  ...Schema.id(),
  title: text().notNull(),
  description: text(),
  assignee_id: uuid(),
  position: integer().notNull(),
  secret: text(),
});

const pick = { title: true, description: true, assignee_id: true } as const;
const patch = Schema.patcher(Table, pick);

describe("Schema.patcher", () => {
  it("passes a supplied value straight through", () => {
    expect(patch({ title: "Ship it" })).toMatchObject({ title: "Ship it" });
  });

  it("turns undefined on a NULLABLE column into NULL", () => {
    // The field was submitted empty, and `.set()` skips undefined keys — which
    // reads as "keep the old value", so clearing a select appeared not to work.
    expect(patch({ title: "x", description: undefined })).toMatchObject({
      description: null,
    });
  });

  it("omits undefined on a NOT NULL column entirely", () => {
    const out = patch({ title: undefined });

    expect("title" in out).toBe(false);
  });

  it("reads only the pick, so an unpicked column cannot be written", () => {
    const out = patch({ title: "x", secret: "leaked" } as never);

    expect("secret" in out).toBe(false);
  });

  it("clears every nullable picked column when the payload is empty", () => {
    expect(patch({})).toEqual({ description: null, assignee_id: null });
  });

  // The `@ts-expect-error` is the assertion; `pnpm check` fails without it.
  it("rejects a key that names no column", () => {
    expect(
      // @ts-expect-error — `nonsense` is not a column on the fixture.
      patch({ title: "x", nonsense: 1 }),
    ).toEqual({ title: "x", description: null, assignee_id: null });
  });

  it("only accepts a pick of the table's own columns", () => {
    // @ts-expect-error — `nonsense` is not a column on the fixture.
    expect(() => Schema.patcher(Table, { nonsense: true })).not.toThrow();
  });
});
