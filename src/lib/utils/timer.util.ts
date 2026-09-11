/** What {@link debounce} hands back: the wrapped call, plus a way to drop a pending one. */
export type Debounced<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void;
  /** Whether a call is waiting to run. For tests, and for UI that wants to say "unsaved". */
  readonly pending: boolean;
};

/**
 * Trailing-edge debounce: the call that ends a flurry is the one that runs.
 *
 * **Deliberately returns `void` rather than a promise, and cancels
 * synchronously.** That pairing is the reason this is fifteen lines here rather
 * than a dependency. Callers discard the result and call `cancel()` as a plain
 * statement partway through a handler, so a promise-returning debounce would
 * give them two hazards for no benefit: a rejected promise nobody is holding on
 * every cancel, and — if `cancel` were async — a cancellation that lands a tick
 * late and takes a *newly scheduled* call with it.
 *
 * A rejecting callback is left to the global handler on purpose rather than
 * caught here. By the time it rejects there is no caller holding the promise,
 * so swallowing it would read as tidier and in fact be a regression: the
 * rejection currently reaches `onunhandledrejection`, and therefore Sentry,
 * which is the only reason anybody finds out the call stopped working.
 *
 * `wait_ms` of `0` still defers by a tick, so a caller wanting "now" should skip
 * the debounce rather than pass zero.
 */
export const debounce = <Args extends unknown[]>(
  fn: (...args: Args) => unknown,
  wait_ms: number,
): Debounced<Args> => {
  let id: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Args) => {
    if (id !== null) clearTimeout(id);

    id = setTimeout(() => {
      id = null;

      void fn(...args);
    }, wait_ms);
  };

  debounced.cancel = () => {
    if (id === null) return;

    clearTimeout(id);
    id = null;
  };

  Object.defineProperty(debounced, "pending", { get: () => id !== null });

  return debounced as Debounced<Args>;
};
