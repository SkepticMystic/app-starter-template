export const TWO_FACTOR = {
  TOTP: {
    DIGITS: 6 as const,
    PERIOD_SECONDS: 30,
  },
  /** Better-Auth's default `trustDeviceMaxAge`, which `auth.ts` does not override. */
  TRUST_DAYS: 30,
};
