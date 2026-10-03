/**
 * The machinery behind the mock wall in `./setup.ts` — see AGENTS.md § Testing.
 * `importOriginal` un-mocks only the module being built, so reading a repo's
 * real shape opens no connection.
 */

import { vi } from "vite-plus/test";

const store = globalThis as Record<string, unknown>;

/**
 * Builds `key` once per worker process, on `globalThis` rather than per module
 * registry. `setupFiles` re-run before every test file and would otherwise hand
 * each file a fresh mock, while the app modules an earlier file loaded keep
 * the first one.
 */
export const memo = async <T>(
  key: string,
  build: () => Promise<T>,
): Promise<T> => {
  if (!(key in store)) store[key] = await build();

  return store[key] as T;
};

/**
 * `vi.fn(impl)`, so `vi.resetAllMocks()` restores it. A resolved promise rather
 * than `undefined`, because almost everything behind the wall is `async`, and a
 * bare `vi.fn()` is a `TypeError` one frame later wherever a caller chains on
 * it.
 */
const async_fn = () => vi.fn(async () => undefined);

/**
 * Every function on `value` as a mock, one level deep (a function, or a
 * namespace of them). Anything else passes through, since the whole module is
 * replaced. Classes are left alone: a mocked constructor yields instances with
 * no methods, so those modules are hand-written in `./setup.ts`.
 */
const mock_value = (value: unknown): unknown => {
  if (typeof value === "function") {
    // A class's `prototype` is non-writable — the signal vitest's own automocker uses.
    const is_class =
      Object.getOwnPropertyDescriptor(value, "prototype")?.writable === false;

    return is_class ? value : async_fn();
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const namespace: Record<string, unknown> = {};

  for (const [name, member] of Object.entries(value)) {
    namespace[name] = typeof member === "function" ? async_fn() : member;
  }

  return namespace;
};

/** {@link mock_value} applied across a module's exports. */
export const automock = <T extends object>(actual: T): T => {
  const mocked: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(actual)) {
    mocked[name] = mock_value(value);
  }

  return mocked as T;
};

/**
 * Automocks the real module, once per worker. `path` is only a memo key, but
 * must be the canonical `#lib/…` specifier: two spellings would memoise as two
 * instances.
 */
export const mock_module = async <T extends object>(
  path: string,
  import_original: () => Promise<T>,
): Promise<T> =>
  memo(`__automock:${path}`, async () => automock(await import_original()));
