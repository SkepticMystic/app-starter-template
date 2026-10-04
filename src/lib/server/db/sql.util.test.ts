import { eq } from "drizzle-orm";
import { integer, PgDialect, text } from "drizzle-orm/pg-core";
import { snakeCase } from "drizzle-orm/pg-core/casing";
import { describe, expect, it } from "vite-plus/test";
import {
  avg_of,
  avg_where,
  count_where,
  email_key_sql,
  sum_of,
  sum_where,
} from "./sql.util.js";

const Table = snakeCase.table("sql_util_fixture", {
  email: text(),
  status: text(),
  amount: integer(),
});

const done = eq(Table.status, "done");

const render = (fragment: Parameters<PgDialect["sqlToQuery"]>[0]) =>
  new PgDialect().sqlToQuery(fragment).sql;

/**
 * What the driver hands back, through the fragment's own decoder — the
 * `mapWith` mapping, which drizzle keeps on a field it does not type.
 */
const decode = (fragment: object, raw: unknown) =>
  (
    fragment as { decoder: { mapFromDriverValue: (v: unknown) => unknown } }
  ).decoder.mapFromDriverValue(raw);

describe("sql.util", () => {
  it("renders a filtered count, decoded from pg's bigint string", () => {
    const fragment = count_where(done);

    expect(render(fragment)).toBe(
      'count(*) filter (where "sql_util_fixture"."status" = $1)',
    );
    expect(decode(fragment, "3")).toBe(3);
  });

  it("coalesces a sum to 0 so an empty group is not null", () => {
    expect(render(sum_where(Table.amount, done))).toBe(
      'coalesce(sum("sql_util_fixture"."amount") filter (where "sql_util_fixture"."status" = $1), 0)',
    );
    expect(render(sum_of(Table.amount))).toBe(
      'coalesce(sum("sql_util_fixture"."amount"), 0)',
    );
    expect(decode(sum_of(Table.amount), "12.5")).toBe(12.5);
  });

  it("keeps an empty average null, never zero", () => {
    expect(decode(avg_of(Table.amount), null)).toBeNull();
    expect(decode(avg_of(Table.amount), "2.5000")).toBe(2.5);
    expect(decode(avg_where(Table.amount, done), null)).toBeNull();
  });

  // The text Postgres was shown to fold `J.ohnSmith+x@googlemail.com` and
  // `john.smith@gmail.com` to one key with. The patterns must stay literals,
  // single-backslashed, or the index on this expression stops matching.
  it("renders the inbox key with literal patterns and one parameter", () => {
    const key = (subject: string) =>
      `regexp_replace(regexp_replace(regexp_replace(lower(${subject}), '\\+[^@]*@', '@'), '@googlemail\\.com$', '@gmail.com'), '\\.(?=[^@]*@gmail\\.com$)', '', 'g')`;

    expect(render(email_key_sql(Table.email))).toBe(
      key('"sql_util_fixture"."email"'),
    );

    const input = new PgDialect().sqlToQuery(email_key_sql("A+b@x.com"));
    expect(input.sql).toBe(key("$1"));
    expect(input.params).toEqual(["A+b@x.com"]);
  });
});
