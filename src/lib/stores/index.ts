import { Items, type Item } from "$lib/utils/items.util";
import { get, type Writable } from "svelte/store";

type ItemStore<T extends Record<string, unknown>> = Writable<Item<T>[]>;

export const Store = {
  find: <T extends Record<string, unknown>>(store: ItemStore<T>, id: string) =>
    Items.find(get(store), id),

  add: <T extends Record<string, unknown>>(
    store: ItemStore<T>,
    item: Item<T>,
  ) => store.update((items) => Items.add(items, item)),

  patch: <T extends Record<string, unknown>>(
    store: ItemStore<T>,
    item_id: string,
    patch: Partial<Item<T>>,
  ) => store.update((items) => Items.patch(items, item_id, patch)),

  delete: <T extends Record<string, unknown>>(
    store: ItemStore<T>,
    item_id: string,
  ) => store.update((items) => Items.remove(items, item_id)),

  filter: <T extends Record<string, unknown>>(
    store: ItemStore<T>,
    ids: string[],
  ) => Items.filter(get(store), ids),
};
