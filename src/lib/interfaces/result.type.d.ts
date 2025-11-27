export type Result<D = undefined, E = undefined> =
  | { ok: true; data: D }
  | { ok: false; error: E };

export type ResultData<R extends Result<unknown, unknown>> = Extract<
  R,
  { ok: true }
>["data"];
