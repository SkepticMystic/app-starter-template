export const Guard = {
  is_nullish: <T>(value: T | null | undefined): value is null | undefined =>
    value === null || value === undefined,

  is_nan: (value: unknown): value is number => Number.isNaN(value),
};
