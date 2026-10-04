import {
  relationsFilterToSQL,
  sql,
  type AnyTableFilter,
  type SQLWrapper,
  type Table,
  type TableFilter,
} from "drizzle-orm";

/**
 * A relational `where` object as SQL, for the APIs that still take SQL —
 * `db.$count` — so a list and its total share one filter. drizzle's own
 * signature takes an untyped filter; this one checks it against `table`.
 */
export const filter_sql = <T extends Table>(table: T, filter: TableFilter<T>) =>
  relationsFilterToSQL(table, filter as AnyTableFilter);

/**
 * An address as the inbox it reaches: lowercased, without a `+tag`, and on
 * Gmail without the dots it ignores, `googlemail.com` folded into `gmail.com`.
 * Dots elsewhere are kept, since other providers treat them as part of the
 * name. The patterns are literals, never parameters, so `user_email_key_idx`
 * — built from this same expression — can answer a lookup by it.
 */
export const email_key_sql = (email: SQLWrapper | string) =>
  sql<string>`regexp_replace(regexp_replace(regexp_replace(lower(${email}), '\\+[^@]*@', '@'), '@googlemail\\.com$', '@gmail.com'), '\\.(?=[^@]*@gmail\\.com$)', '', 'g')`;

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
