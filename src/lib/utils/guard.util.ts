export const Guard = {
  is_nullish: (value: unknown): value is null | undefined => value === null || value === undefined,

  is_nan: (value: unknown): value is number => Number.isNaN(value),
};
