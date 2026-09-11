import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import type { FullQueryResults } from "@neondatabase/serverless";
import { captureException } from "@sentry/sveltekit";
import { DrizzleError, DrizzleQueryError } from "drizzle-orm";

const log = Log.child({ service: "Repo" });

/**
 * Matched as substrings rather than by Postgres error code, because a code is
 * not what reaches us: Postgres puts the constraint name in the sentence and
 * Neon wraps the whole thing, so there is no stable code to switch on.
 */
const DUPLICATE_KEY = "duplicate key value violates unique constraint";
const FOREIGN_KEY = "violates foreign key constraint";

type Expected = readonly (readonly [string, App.Error])[];

/** Writes: a unique violation is the caller's answer, not our fault. */
const ON_DUPLICATE: Expected = [[DUPLICATE_KEY, ERROR.DUPLICATE]];

/**
 * Deletes only, deliberately. The same violation on an insert or update means
 * we built a row pointing at nothing, which is our bug and belongs in Sentry.
 * On a delete it means something still references the row — an ordinary answer.
 */
const ON_RESTRICT: Expected = [[FOREIGN_KEY, ERROR.CONFLICT]];

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
  const message =
    error instanceof DrizzleQueryError
      ? (error.cause?.message ?? "")
      : error instanceof Error
        ? error.message
        : "";

  for (const [needle, answer] of expected) {
    if (message.includes(needle)) return answer;
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

const insert = <D>(promise: Promise<D[]>) =>
  run("insert", promise, ON_DUPLICATE);

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

type DeleteResult = Omit<FullQueryResults<false>, "rows"> & { rows: never[] };

const del = async (
  promise: Promise<DeleteResult>,
): Promise<App.Result<{ row_count: number }>> => {
  const res = await run("delete", promise, ON_RESTRICT);
  if (!res.ok) return res;

  return result.suc({ row_count: res.data.rowCount });
};

const delete_one = async (
  promise: Promise<DeleteResult>,
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

export const Repo = {
  query,
  insert,
  insert_one,
  update,
  update_one,
  update_void,
  update_applied,
  delete: del,
  delete_one,
  count,
  contains,
};
