/** One statement the `sql` project's drizzle compiled and recorded instead of sending. */
type Statement = { sql: string; params: unknown[] };

const store = globalThis as Record<string, unknown>;

type Recorder = {
  /** Every statement sent in the current test, in order. */
  calls: Statement[];
  /**
   * What each next statement answers, one entry per statement; once it runs
   * out, `[]`. A builder query reads positional rows (`[[…values]]`), an
   * `execute` reads row objects.
   */
  rows: unknown[][];
};

/**
 * The knob behind `setup.sql.ts`'s `drizzle.db`. One per worker, on
 * `globalThis`, for the reason that mock is in a setup file: a repo is
 * evaluated once per worker, so it can only ever write to one recorder.
 * `setup.sql.ts` empties both lists before each test.
 */
export const recorder = (store["__sql_recorder"] ??= {
  calls: [],
  rows: [],
}) as Recorder;

export const reset_recorder = () => {
  recorder.calls.length = 0;
  recorder.rows = [];
};
