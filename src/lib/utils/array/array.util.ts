export type Resource<
  T extends Record<string, unknown> = Record<string, unknown>,
> = T & { id: string };

/** Find an item by its ID */
const find = <T extends Record<string, unknown>>(
  items: Resource<T>[],
  id: string,
): Resource<T> | undefined => {
  return items.find((item) => item.id === id);
};

/** Add a new item */
const add = <T extends Record<string, unknown>>(
  items: T[],
  item: T,
  options?: { front?: boolean },
): T[] => {
  if (options?.front) {
    return [item, ...items];
  } else {
    return [...items, item];
  }
};

/** Patch an item by its ID */
const patch = <T extends Record<string, unknown>>(
  items: Resource<T>[],
  id: string,
  patch: Partial<T>,
): Resource<T>[] => {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
};

/** Remove an item by its ID */
const remove = <T extends Record<string, unknown>>(
  items: Resource<T>[],
  id: string,
): Resource<T>[] => {
  return items.filter((item) => item.id !== id);
};

/** Filter items by a list of IDs */
const filter = <T extends Record<string, unknown>>(
  items: Resource<T>[],
  ids: string[],
): Resource<T>[] => {
  const set = new Set(ids);
  return items.filter((item) => set.has(item.id));
};

export const Arrays = {
  find,
  add,
  patch,
  remove,
  filter,
};
