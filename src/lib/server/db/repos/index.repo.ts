import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { DrizzleError, DrizzleQueryError } from "drizzle-orm";
import type { DatabaseError } from "pg";

const log = Log.child({ service: "Repo" });

/**
 * Postgres SQLSTATEs, replacing the substring matching this file used to do.
 *
 * The comment that stood here was correct about its own situation — Postgres
 * puts the constraint name in the sentence, and the Neon HTTP driver wrapped
 * the whole thing, leaving no code to switch on. It is simply no longer true:
 * `pg` surfaces `.code` verbatim, along with `.constraint`, `.table`,
 * `.column` and `.detail`. That turns "duplicate key" into "duplicate on
 * user_email_unique", which is the difference between a Sentry issue you can
 * act on and one you cannot.
 */
export const PG_ERROR = {
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  EXCLUSION_VIOLATION: "23P01",
  NOT_NULL_VIOLATION: "23502",
  CHECK_VIOLATION: "23514",
  STRING_TOO_LONG: "22001",
  INVALID_TEXT_REPRESENTATION: "22P02",
  SERIALIZATION_FAILURE: "40001",
  DEADLOCK_DETECTED: "40P01",
  QUERY_CANCELED: "57014",
  ADMIN_SHUTDOWN: "57P01",
  TOO_MANY_CONNECTIONS: "53300",
} as const;

type Expected = readonly (readonly [string, App.Error])[];

/** Writes: a unique violation is the caller's answer, not our fault. */
const ON_DUPLICATE: Expected = [
  [PG_ERROR.UNIQUE_VIOLATION, ERROR.DUPLICATE],
  // The other "that row already exists" constraint, same shape of answer.
  [PG_ERROR.EXCLUSION_VIOLATION, ERROR.DUPLICATE],
];

/**
 * Deletes only, deliberately. The same violation on an insert or update means
 * we built a row pointing at nothing, which is our bug and belongs in Sentry.
 * On a delete it means something still references the row — an ordinary answer.
 */
const ON_RESTRICT: Expected = [
  [PG_ERROR.FOREIGN_KEY_VIOLATION, ERROR.CONFLICT],
];

/**
 * Not the caller's answer — these are still logged and filed — but a 500 is
 * the wrong status for them. A cancelled statement is a timeout, and a
 * serialization failure or deadlock is a conflict the caller can retry.
 */
const STATUS_BY_CODE: Readonly<Record<string, App.Error>> = {
  [PG_ERROR.QUERY_CANCELED]: ERROR.TIMEOUT,
  [PG_ERROR.SERIALIZATION_FAILURE]: ERROR.CONFLICT,
  [PG_ERROR.DEADLOCK_DETECTED]: ERROR.CONFLICT,
};

/**
 * Duck-typed rather than `instanceof DatabaseError`, for three reasons:
 * drizzle wraps the driver error in `DrizzleQueryError.cause`, `pg` is CJS and
 * can end up duplicated in the module graph so constructor identity is not
 * reliable, and `severity` is a tighter test than a five-character `code`
 * alone — `EPIPE` is also five uppercase characters, but only Postgres
 * attaches a `severity`.
 */
const pg_error = (error: unknown): DatabaseError | undefined => {
  let current: unknown = error;

  for (let depth = 0; depth < 4; depth++) {
    if (
      current instanceof Error &&
      "severity" in current &&
      "code" in current &&
      typeof current.code === "string"
    ) {
      return current as DatabaseError;
    }

    if (!(current instanceof Error)) return undefined;

    current = current.cause;
  }

  return undefined;
};

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
  const pg = pg_error(error);

  if (pg?.code) {
    for (const [code, answer] of expected) {
      if (code === pg.code) return answer;
    }
  }

  const tags = pg
    ? { pg_code: pg.code, pg_constraint: pg.constraint, pg_table: pg.table }
    : undefined;

  if (error instanceof DrizzleQueryError) {
    log.error(
      { err: error, pg_code: pg?.code },
      `${scope}.error DrizzleQueryError`,
    );
    captureException(error, {
      tags,
      extra: { query: error.query, detail: pg?.detail },
    });
  } else if (error instanceof DrizzleError) {
    log.error({ err: error, pg_code: pg?.code }, `${scope}.error DrizzleError`);
    captureException(error, { tags });
  } else {
    log.error({ err: error, pg_code: pg?.code }, `${scope}.error unknown`);
    captureException(error, { tags });
  }

  return (
    (pg?.code ? STATUS_BY_CODE[pg.code] : undefined) ??
    ERROR.INTERNAL_SERVER_ERROR
  );
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
  promise: Promise<{ rowCount: number | null }>,
): Promise<App.Result<void>> => {
  const res = await run("update_void", promise, ON_DUPLICATE);
  if (!res.ok) return res;

  // `?? 0` via falsiness: `pg` reports null for statements with no row count.
  if (!res.data.rowCount) return result.err(ERROR.NOT_FOUND);

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

/**
 * `pg` types `rowCount` as `number | null` — null for statements that report
 * no count — where `@neondatabase/serverless`'s `FullQueryResults` typed it
 * `number`. Null is treated as zero throughout, which for a DELETE or UPDATE
 * reads as "not found": the safe interpretation.
 */
type DeleteResult = { rowCount: number | null };

const del = async (
  promise: Promise<DeleteResult>,
): Promise<App.Result<{ row_count: number }>> => {
  const res = await run("delete", promise, ON_RESTRICT);
  if (!res.ok) return res;

  return result.suc({ row_count: res.data.rowCount ?? 0 });
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
