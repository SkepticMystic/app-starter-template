const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Runs `run` until it settles in a way `should_retry` accepts, or `attempts` is spent.
 *
 * Never throws: a rejection is an outcome like any other, so the caller decides what a final
 * failure means. A call that answers its failures as values (Resend's `{ error }`) and one that
 * throws them go through the same `should_retry`.
 */
export const retry = async <T>(
  run: () => Promise<T>,
  opts: {
    /** Total attempts, the first included. */
    attempts: number;
    should_retry: (outcome: PromiseSettledResult<T>) => boolean;
    /** The pause after failed attempt `attempt` (1-based), before the next one. */
    delay_ms: (attempt: number) => number;
    on_retry?: (outcome: PromiseSettledResult<T>, attempt: number) => void;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<{ outcome: PromiseSettledResult<T>; attempts: number }> => {
  const sleep = opts.sleep ?? wait;

  for (let attempt = 1; ; attempt += 1) {
    // oxlint-disable-next-line no-await-in-loop -- each attempt waits on the last by design
    const outcome = await run().then(
      (value): PromiseSettledResult<T> => ({ status: "fulfilled", value }),
      (error: unknown): PromiseSettledResult<T> => ({
        status: "rejected",
        reason: error,
      }),
    );

    if (attempt >= opts.attempts || !opts.should_retry(outcome)) {
      return { outcome, attempts: attempt };
    }

    opts.on_retry?.(outcome, attempt);

    // oxlint-disable-next-line no-await-in-loop -- the backoff is the point
    await sleep(opts.delay_ms(attempt));
  }
};
