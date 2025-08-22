import type { SID } from "$lib/interfaces";
import { get, type Writable } from "svelte/store";

type Item = Record<string, unknown>;

const get_by_id = <T extends Item>(store: Writable<SID<T>[]>, _id: string) =>
  get(store).find((item) => item._id === _id);

export const Store = {
  get_by_id,

  create: <T extends Item>(store: Writable<SID<T>[]>, resource: SID<T>) =>
    store.update((items) => [...items, resource]),

  patch: <T extends Item>(
    store: Writable<SID<T>[]>,
    resource_id: string,
    resource: Partial<T>,
  ) =>
    store.update((items) =>
      items.map((item) =>
        item._id === resource_id ? { ...item, ...resource } : item,
      ),
    ),

  delete: <T extends Item>(store: Writable<SID<T>[]>, resource_id: string) =>
    store.update((items) => items.filter((item) => item._id !== resource_id)),
};
