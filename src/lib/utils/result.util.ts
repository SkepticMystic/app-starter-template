import type { Err, Suc } from "$lib/interfaces";

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
