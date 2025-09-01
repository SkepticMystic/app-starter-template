export type Item<T extends Record<string, unknown> = Record<string, unknown>> =
  T & { id: string };

/** Find an item by its ID */
const find = <T extends Record<string, unknown>>(
  items: Item<T>[],
  id: string,
): Item<T> | undefined => {
  return items.find((item) => item.id === id);
};

/** Add a new item */
const add = <T extends Record<string, unknown>>(
  items: Item<T>[],
  item: Item<T>,
  options?: { front?: boolean },
): Item<T>[] => {
  if (options?.front) {
    return [item, ...items];
  } else {
    return [...items, item];
  }
};

/** Patch an item by its ID */
const patch = <T extends Record<string, unknown>>(
  items: Item<T>[],
  id: string,
  patch: Partial<T>,
): Item<T>[] => {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
};

/** Remove an item by its ID */
const remove = <T extends Record<string, unknown>>(
  items: Item<T>[],
  id: string,
): Item<T>[] => {
  return items.filter((item) => item.id !== id);
};

/** Filter items by a list of IDs */
const filter = <T extends Record<string, unknown>>(
  items: Item<T>[],
  ids: string[],
): Item<T>[] => {
  const idSet = new Set(ids);
  return items.filter((item) => idSet.has(item.id));
};

export const Items = {
  find,
  add,
  patch,
  remove,
  filter,
};
