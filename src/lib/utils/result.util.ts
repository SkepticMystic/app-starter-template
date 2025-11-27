import type { Result } from "$lib/interfaces/result.type";

const suc = <D = undefined>(d?: D): Result<D, never> => ({
  ok: true,
  data: d as D,
});
const err = <E = undefined>(e?: E): Result<never, E> => ({
  ok: false,
  error: e as E,
});

export const result = {
  err,
  suc,

  unwrap_or: <D, E>(res: Result<D, E> | undefined, d: D) =>
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
};
