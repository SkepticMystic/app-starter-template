import type { Result } from "#lib/interfaces/result.type.js";
import { error as kit_error } from "@sveltejs/kit";
import type { APIError } from "better-auth";

const suc = <D = undefined>(d: D): Result<D, never> => ({
  ok: true,
  data: d,
});
const err = <E = undefined>(e: E): Result<never, E> => ({
  ok: false,
  error: e,
});

export const result = {
  err,
  suc,

  unwrap_or: <D>(res: Result<D, unknown> | undefined, d: D) =>
    res?.ok ? res.data : d,

  pipe: <D1, E, D2>(
    r: Result<D1, E>,
    s: (d: D1) => D2,
    e?: (e: E) => E,
  ): Result<D2, E> => {
    if (r.ok) {
      return suc(s(r.data));
    } else {
      return e ? err(e(r.error)) : r;
    }
  },

  from_ba_error: (
    error: APIError,
    extra?: Partial<App.Error>,
  ): App.Result<never> =>
    err({
      message: error.message,
      status: error.statusCode,
      ...extra,
    }),
};

/**
 * Throws a refused result as kit's own error, its status and properties
 * intact: `if (!res.ok) raise(res.error)`.
 *
 * Typed explicitly rather than inferred, because only an explicit `never`
 * annotation makes a call to it narrow `res` afterwards, as `error()` does.
 * It replaces `error(res.error.status ?? 500, res.error.message, res.error)`,
 * whose fallback has been dead since `App.Error.status` became required.
 */
export const raise: (app_error: App.Error) => never = (app_error) =>
  kit_error(app_error.status, app_error.message, app_error);
