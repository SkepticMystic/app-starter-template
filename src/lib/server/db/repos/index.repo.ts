import { ERROR } from "#lib/const/error.const.js";
import type { Sort } from "#lib/schema/query/query.schema.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import type { FullQueryResults } from "@neondatabase/serverless";
import { captureException } from "@sentry/sveltekit";
import {
  Column,
  DrizzleError,
  DrizzleQueryError,
  is,
  sql,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";

const log = Log.child({ service: "Repo" });

/**
 * A driver failure we recognise: by SQLSTATE first, and by message text as a
 * fallback for a failure re-raised without its code.
 *
 * The code is the reliable half. `@neondatabase/serverless` copies `code` (and
 * `constraint`, `detail`, …) off the HTTP error body onto its `NeonDbError`,
 * which drizzle hands over as the `DrizzleQueryError`'s `cause`. The message is
 * locale-dependent and carries the constraint name mid-sentence, so it only
 * ever backs the code up.
 */
type Signature = { readonly code: string; readonly needle: string };

const DUPLICATE_KEY: Signature = {
  code: "23505",
  needle: "duplicate key value violates unique constraint",
};

const FOREIGN_KEY: Signature = {
  code: "23503",
  needle: "violates foreign key constraint",
};

/**
 * SQLSTATEs that mean "run it again": the statement lost a race and nothing is
 * broken. Rare on neon-http, which has no interactive transactions, but a
 * `db.batch()` runs as one and can still deadlock against another.
 */
const RETRYABLE = new Set([
  // serialization_failure
  "40001",
  // deadlock_detected
  "40P01",
]);

/** A lost race, answered as a `CONFLICT` to retry rather than reported. */
const COLLIDED: App.Error = {
  ...ERROR.CONFLICT,
  message:
    "That collided with another change made at the same moment. Try again.",
};

type Expected = readonly (readonly [Signature, App.Error])[];

/** Writes: a unique violation is the caller's answer, not our fault. */
const ON_DUPLICATE: Expected = [[DUPLICATE_KEY, ERROR.DUPLICATE]];

/**
 * Deletes only, deliberately. The same violation on an insert or update means
 * we built a row pointing at nothing, which is our bug and belongs in Sentry.
 * On a delete it means something still references the row — an ordinary answer.
 */
const ON_RESTRICT: Expected = [[FOREIGN_KEY, ERROR.CONFLICT]];

/** The SQLSTATE the server answered with, if the failure carries one. */
const sqlstate = (error: unknown): string | undefined =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof error.code === "string"
    ? error.code
    : undefined;

/**
 * The one error ladder, replacing six copy-pasted ones.
 *
 * `expected` is matched **before anything is logged**, which is the fix for a
 * real inconsistency: `update_one` and `update_void` already checked first (their
 * comment said so), while `insert` and `update` captured to Sentry first. An
 * identical duplicate-key failure therefore filed noise on an insert and stayed
 * quiet on an update, decided purely by which copy happened to run.
 */
const to_error = (
  scope: string,
  error: unknown,
  expected: Expected = [],
): App.Error => {
  const cause = error instanceof DrizzleQueryError ? error.cause : error;
  const code = sqlstate(cause);
  const message = cause instanceof Error ? cause.message : "";

  if (code && RETRYABLE.has(code)) {
    log.warn({ code }, `${scope}.collided`);

    return COLLIDED;
  }

  for (const [signature, answer] of expected) {
    if (code === signature.code || message.includes(signature.needle)) {
      return answer;
    }
  }

  if (error instanceof DrizzleQueryError) {
    log.error(error, `${scope}.error DrizzleQueryError`);
    captureException(error, { extra: { query: error.query } });
  } else if (error instanceof DrizzleError) {
    log.error(error, `${scope}.error DrizzleError`);
    captureException(error);
  } else {
    log.error(error, `${scope}.error unknown`);
    captureException(error);
  }

  return ERROR.INTERNAL_SERVER_ERROR;
};

/** What neon-http resolves a statement without `RETURNING` to. */
type NoRows = Omit<FullQueryResults<false>, "rows"> & { rows: never[] };

const run = async <D>(
  scope: string,
  promise: Promise<D>,
  expected?: Expected,
): Promise<App.Result<D>> => {
  try {
    return result.suc(await promise);
  } catch (error) {
    return result.err(to_error(scope, error, expected));
  }
};

const query = <D>(promise: Promise<D>) => run("query", promise);

/** For a `select … limit 1`: whether any row matched, without fetching the rest. */
const exists = async (
  promise: Promise<unknown[]>,
): Promise<App.Result<boolean>> => {
  const res = await run("exists", promise);
  if (!res.ok) return res;

  return result.suc(res.data.length > 0);
};

const insert = <D>(promise: Promise<D[]>) =>
  run("insert", promise, ON_DUPLICATE);

/**
 * An insert without `RETURNING`, folded to how many rows it wrote — for a
 * set-based insert whose rows nobody reads, where `RETURNING` would ship every
 * one of them back over HTTP for nothing.
 */
const insert_count = async (
  promise: Promise<NoRows>,
): Promise<App.Result<{ row_count: number }>> => {
  const res = await run("insert", promise, ON_DUPLICATE);
  if (!res.ok) return res;

  return result.suc({ row_count: res.data.rowCount });
};

const insert_one = async <D>(promise: Promise<D[]>): Promise<App.Result<D>> => {
  const res = await insert(promise);
  if (!res.ok) return res;

  const [data] = res.data;
  if (!data) {
    log.error("insert_one.error no data");

    return result.err({
      ...ERROR.INTERNAL_SERVER_ERROR,
      message: "Failed to create",
    });
  }

  return result.suc(data);
};

const update = <D>(promise: Promise<D[]>) =>
  run("update", promise, ON_DUPLICATE);

const update_one = async <D>(promise: Promise<D[]>): Promise<App.Result<D>> => {
  const res = await run("update_one", promise, ON_DUPLICATE);
  if (!res.ok) return res;

  const [first] = res.data;
  if (!first) {
    log.error("update_one.error no data");

    return result.err(ERROR.NOT_FOUND);
  }

  return result.suc(first);
};

/**
 * Execute an update without returning data.
 * Validates that **at least** 1 row was affected — which is what the
 * `rowCount === 0` check below actually tests.
 */
const update_void = async (
  promise: Promise<{ rowCount: number }>,
): Promise<App.Result<void>> => {
  const res = await run("update_void", promise, ON_DUPLICATE);
  if (!res.ok) return res;

  if (res.data.rowCount === 0) return result.err(ERROR.NOT_FOUND);

  return result.suc(undefined);
};

/**
 * The guarded write — `UPDATE … WHERE <guard> RETURNING id`.
 *
 * `applied: false` is an ordinary answer rather than an error: the guard (a
 * status, an attempt counter, a version) said somebody else got there first.
 */
const update_applied = async <D>(
  promise: Promise<D[]>,
): Promise<App.Result<{ applied: boolean }>> => {
  const res = await update(promise);
  if (!res.ok) return res;

  return result.suc({ applied: res.data.length > 0 });
};

const del = async (
  promise: Promise<NoRows>,
): Promise<App.Result<{ row_count: number }>> => {
  const res = await run("delete", promise, ON_RESTRICT);
  if (!res.ok) return res;

  return result.suc({ row_count: res.data.rowCount });
};

const delete_one = async (
  promise: Promise<NoRows>,
): Promise<App.Result<void>> => {
  const res = await del(promise);
  if (!res.ok) return res;

  if (!res.data.row_count) {
    log.error("delete_one.error not found");

    return result.err(ERROR.NOT_FOUND);
  }

  return result.suc(undefined);
};

/**
 * A standalone whole-query count. Its own member rather than {@link query}
 * because `db.$count(table, where)` resolves to a **scalar**, and `query` is
 * typed `Promise<D[]>` — it would infer `number[]` and reintroduce the `?? 0`
 * tail that ten call sites were writing by hand. That `?? 0` was load-bearing
 * in none of them: a `count(*)` with no `GROUP BY` always returns one row.
 *
 * A `count()` inside an aggregate selection still belongs on {@link query}.
 */
const count = (promise: Promise<number>) => run("count", promise);

/**
 * Wraps a search term for `LIKE`/`ILIKE`, escaping the wildcards.
 *
 * There is no injection to close — drizzle binds the pattern — but `%` and `_`
 * are still LIKE syntax *inside* the parameter. A search term of `%` matches
 * every row, so the full table comes back and `total` reports the unfiltered
 * count as though the filter had applied, with nothing on screen saying the
 * narrowing was ignored.
 *
 * Backslash must be escaped FIRST: it is Postgres LIKE's default escape
 * character, so doing it last would escape the escapes.
 */
const contains = (term: string) =>
  `%${term
    .replaceAll("\\", String.raw`\\`)
    .replaceAll("%", String.raw`\%`)
    .replaceAll("_", String.raw`\_`)}%`;

/**
 * A list's `ORDER BY` from its query's `sort`, through an allow-list: `columns`
 * names what each key the list offers orders by, so a client-supplied key is
 * never interpolated. `tiebreak` (the `id`) goes last in the same direction, so
 * OFFSET paging is stable where the key ties — two rows with one name would
 * otherwise trade pages between requests.
 *
 * A nullable key puts its NULLs last either way, so "largest first" does not
 * open on a page of blanks. A `NOT NULL` key says nothing, and that is
 * load-bearing: `desc nulls last` is not the order a backward scan of an
 * ascending index yields, so on `created_at` it would trade the index for a
 * sort of every row.
 */
const order_by = <K extends string>(
  sort: Sort<K>,
  columns: Record<K, AnyColumn | SQL>,
  tiebreak: AnyColumn,
): SQL[] => {
  const direction = sort.desc ? "desc" : "asc";
  // `Object.hasOwn`, not `in`: a key that slipped past validation must not
  // resolve to something on the prototype, like `constructor`.
  if (!Object.hasOwn(columns, sort.key)) {
    return [sql`${tiebreak} ${sql.raw(direction)}`];
  }

  const column = columns[sort.key];
  const nulls = is(column, Column) && column.notNull ? "" : " nulls last";

  return [
    sql`${column} ${sql.raw(direction + nulls)}`,
    sql`${tiebreak} ${sql.raw(direction)}`,
  ];
};

export const Repo = {
  query,
  exists,
  insert,
  insert_count,
  insert_one,
  update,
  update_one,
  update_void,
  update_applied,
  delete: del,
  delete_one,
  count,
  contains,
  order_by,
};
