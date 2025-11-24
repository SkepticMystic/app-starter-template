import type { Err, Result, Suc } from "$lib/interfaces";

export const err = <E = undefined>(e?: E): Err<E> => {
  const res = { ok: false } as Err<E>;
  if (e) res["error"] = e;
  return res;
};
export const suc = <D = undefined>(d?: D): Suc<D> => {
  const res = { ok: true } as Suc<D>;
  if (d) res["data"] = d;
  return res;
};

export const result = {
  err,
  suc,

  unwrap_or: <D, E>(res: Result<D, E>, d: D) => (res.ok ? res.data : d),

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
