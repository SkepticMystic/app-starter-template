import type { ObjectId } from "mongodb";

export type Suc<D extends unknown = undefined> = { ok: true; data: D };
export type Err<E extends unknown = undefined> = { ok: false; error: E };

export type Result<
  D extends unknown = undefined,
  E extends unknown = undefined,
> = Suc<D> | Err<E>;

export type SID<T> = T & { _id: string };
export type OID<T> = T & { _id: ObjectId };

export type Timestamps = { createdAt: Date; updatedAt: Date };

export type MaybePromise<T> = T | Promise<T>;

// Allows types like { count: number } & Record<string, any>
// to still get proper intellisense for 'count'
export type PartiallyTypedObject<T> = {
  [K in keyof T]: T[K];
} & {
  [key: string]: any;
};
