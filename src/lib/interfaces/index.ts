export type Suc<D> = { ok: true; data: D };
export type Err<E> = { ok: false; error: E };

export type Result<D = undefined, E = undefined> = Suc<D> | Err<E>;

export type Timestamps = { createdAt: Date; updatedAt: Date };

export type MaybePromise<T> = T | Promise<T>;

// Allows types like { count: number } & Record<string, any>
// to still get proper intellisense for 'count'
export type PartiallyTypedObject<T> = {
  [K in keyof T]: T[K];
};
