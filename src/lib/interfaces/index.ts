export type Suc<D> = { ok: true; data: D };
export type Err<E> = { ok: false; error: E };

export type Result<D = undefined, E = undefined> = Suc<D> | Err<E>;

export type ResultData<R extends Result<unknown, unknown>> = Extract<
  R,
  { ok: true }
>["data"];

export type MaybePromise<T> = T | Promise<T>;

export type SelectOption<V, D = undefined> = D extends undefined
  ? {
      value: V;
      label: string;
      icon?: string;
      group?: string;
      keywords?: string[];
      disabled?: boolean;
    }
  : {
      data: D;
      value: V;
      label: string;
      icon?: string;
      group?: string;
      keywords?: string[];
      disabled?: boolean;
    };

// Allows types like { count: number } & Record<string, any>
// to still get proper intellisense for 'count'
export type PartiallyTypedObject<T> = {
  [K in keyof T]: T[K];
};
