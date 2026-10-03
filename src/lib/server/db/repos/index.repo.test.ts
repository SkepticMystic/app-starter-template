import { ERROR } from "#lib/const/error.const.js";
import { result } from "#lib/utils/result.util.js";
import { captureException } from "@sentry/sveltekit";
import { DrizzleQueryError, sql } from "drizzle-orm";
import { PgDialect, integer, text, uuid } from "drizzle-orm/pg-core";
import { snakeCase } from "drizzle-orm/pg-core/casing";
import { describe, expect, it, vi } from "vite-plus/test";
// The real wrapper: repo tests run in the `sql` project, off the mock wall.
import { Repo } from "./index.repo";

describe("Repo.contains", () => {
  it("wraps an ordinary term in wildcards", () => {
    expect(Repo.contains("ross")).toBe("%ross%");
  });

  it("escapes a literal % so it cannot match every row", () => {
    // Unescaped, this is the bug: `%` matches everything, the full table comes
    // back, and `total` reports the unfiltered count as though it had filtered.
    expect(Repo.contains("%")).toBe(String.raw`%\%%`);
  });

  it("escapes a literal _ so it matches one underscore, not any character", () => {
    expect(Repo.contains("a_b")).toBe(String.raw`%a\_b%`);
  });

  it("escapes the backslash first, so it does not escape the escapes", () => {
    expect(Repo.contains(String.raw`a\b`)).toBe(String.raw`%a\\b%`);
  });

  it("handles a term combining all three", () => {
    expect(Repo.contains("50%_\\")).toBe(String.raw`%50\%\_\\%`);
  });
});

/** A `NeonDbError`, as far as `Repo` reads one: the SQLSTATE on `code`. */
const answered = (code: string | undefined, message: string) =>
  Object.assign(new Error(message), { severity: "ERROR", code });

/** What drizzle rejects with when its client throws `cause`. */
const failed = (cause: Error) =>
  Promise.reject(new DrizzleQueryError("insert into x", [], cause));

describe("Repo — a failed statement", () => {
  it.each([
    ["40001", "could not serialize access"],
    ["40P01", "deadlock detected"],
  ])(
    "answers %s, a lost race, as a CONFLICT to retry, unreported",
    async (code, message) => {
      const res = await Repo.update(failed(answered(code, message)));

      expect(res).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
      expect(vi.mocked(captureException)).not.toHaveBeenCalled();
    },
  );

  it("answers a unique violation as a DUPLICATE by its SQLSTATE alone", async () => {
    // A localised server would phrase this differently; the code still holds.
    await expect(
      Repo.insert(failed(answered("23505", "doppelter Schlüsselwert"))),
    ).resolves.toEqual(result.err(ERROR.DUPLICATE));
    expect(vi.mocked(captureException)).not.toHaveBeenCalled();
  });

  it("falls back to the message when the code was lost", async () => {
    await expect(
      Repo.insert(
        failed(
          answered(
            undefined,
            'duplicate key value violates unique constraint "x_key"',
          ),
        ),
      ),
    ).resolves.toEqual(result.err(ERROR.DUPLICATE));
  });

  it("answers a restricting FK on a delete as a CONFLICT", async () => {
    await expect(
      Repo.delete(failed(answered("23503", "violates foreign key constraint"))),
    ).resolves.toEqual(result.err(ERROR.CONFLICT));
  });

  it("reports the same FK violation on an insert as ours", async () => {
    await expect(
      Repo.insert(failed(answered("23503", "violates foreign key constraint"))),
    ).resolves.toEqual(result.err(ERROR.INTERNAL_SERVER_ERROR));
    expect(vi.mocked(captureException)).toHaveBeenCalledOnce();
  });

  it("reports anything else as ours", async () => {
    await expect(
      Repo.query(failed(answered("42P01", 'relation "x" does not exist'))),
    ).resolves.toEqual(result.err(ERROR.INTERNAL_SERVER_ERROR));
    expect(vi.mocked(captureException)).toHaveBeenCalledOnce();
  });
});

describe("Repo.exists", () => {
  it("is true when the select found a row", async () => {
    await expect(Repo.exists(Promise.resolve([{ id: 1 }]))).resolves.toEqual(
      result.suc(true),
    );
  });

  it("is false when it found none", async () => {
    await expect(Repo.exists(Promise.resolve([]))).resolves.toEqual(
      result.suc(false),
    );
  });
});

describe("Repo.insert_count", () => {
  it("folds the result to the rows written", async () => {
    const written = { rowCount: 3, rows: [] as never[] } as never;

    await expect(Repo.insert_count(Promise.resolve(written))).resolves.toEqual(
      result.suc({ row_count: 3 }),
    );
  });
});

const render = (parts: ReturnType<typeof Repo.order_by>) =>
  new PgDialect().sqlToQuery(sql.join(parts, sql`, `)).sql;

describe("Repo.order_by", () => {
  const Table = snakeCase.table("order_fixture", {
    id: uuid().primaryKey(),
    name: text().notNull(),
    score: integer(),
  });

  const columns = { name: Table.name, score: Table.score };

  it("orders a NOT NULL key plainly, with the id as tiebreak", () => {
    expect(
      render(Repo.order_by({ key: "name", desc: true }, columns, Table.id)),
    ).toBe('"order_fixture"."name" desc, "order_fixture"."id" desc');
  });

  it("puts a nullable key's NULLs last", () => {
    expect(
      render(Repo.order_by({ key: "score", desc: false }, columns, Table.id)),
    ).toBe('"order_fixture"."score" asc nulls last, "order_fixture"."id" asc');
  });

  it("falls back to the tiebreak for a key outside the allow-list", () => {
    const sort = { key: "constructor", desc: false } as never;

    expect(render(Repo.order_by(sort, columns, Table.id))).toBe(
      '"order_fixture"."id" asc',
    );
  });
});
