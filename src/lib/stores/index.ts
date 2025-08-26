import { get, type Writable } from "svelte/store";
import type { PartiallyTypedObject } from "../interfaces";

type Item = PartiallyTypedObject<{ id: string }>;

const get_by_id = <T extends Item>(store: Writable<T[]>, id: string) =>
  get(store).find((item) => item.id === id);

export const Store = {
  get_by_id,

  create: <T extends Item>(store: Writable<T[]>, resource: T) =>
    store.update((items) => [...items, resource]),

  patch: <T extends Item>(
    store: Writable<T[]>,
    resource_id: string,
    resource: Partial<T>,
  ) =>
    store.update((items) =>
      items.map((item) =>
        item.id === resource_id ? { ...item, ...resource } : item,
      ),
    ),

  delete: <T extends Item>(store: Writable<T[]>, resource_id: string) =>
    store.update((items) => items.filter((item) => item.id !== resource_id)),
};
