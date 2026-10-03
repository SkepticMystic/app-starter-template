import { sql, type SQLWrapper } from "drizzle-orm";

/**
 * Aggregate fragments for a reporting `select`. Each is mapped to a JS number
 * because Postgres returns `count()` as a bigint and `sum()`/`avg()` over
 * `numeric` as strings, which the driver hands over untouched.
 */

/** `count(*) filter (where …)`, as a number rather than pg's bigint string. */
export const count_where = (condition: SQLWrapper) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);

/** `sum(…) filter (where …)`, coalesced to `0`. */
export const sum_where = (value: SQLWrapper, condition: SQLWrapper) =>
  sql<number>`coalesce(sum(${value}) filter (where ${condition}), 0)`.mapWith(
    Number,
  );

/** {@link sum_where} with no predicate. */
export const sum_of = (value: SQLWrapper) =>
  sql<number>`coalesce(sum(${value}), 0)`.mapWith(Number);

const number_or_null = (raw: unknown) => (raw === null ? null : Number(raw));

/**
 * `avg(…)`, keeping `null` for an empty group, so "no data" is never
 * reported as an average of zero.
 */
export const avg_of = (value: SQLWrapper) =>
  sql<number | null>`avg(${value})`.mapWith(number_or_null);

/** {@link avg_of} with a predicate, keeping `null` where it matched nothing. */
export const avg_where = (value: SQLWrapper, condition: SQLWrapper) =>
  sql<number | null>`avg(${value}) filter (where ${condition})`.mapWith(
    number_or_null,
  );
