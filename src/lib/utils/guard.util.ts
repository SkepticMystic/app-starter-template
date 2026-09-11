export const Guard = {
  is_nullish: (value: unknown): value is null | undefined =>
    value === null || value === undefined,

  is_nan: (value: unknown): value is number => Number.isNaN(value),

  /**
   * A caught value's message, or the fallback.
   *
   * `fallback` has no default on purpose: a caught error's own message is often
   * too internal to put in front of a reader, so the caller has to say what
   * they see instead of getting one by accident.
   */
  error_message: (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback,
};
