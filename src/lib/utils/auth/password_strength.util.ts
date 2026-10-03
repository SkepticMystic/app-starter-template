import { AUTH } from "#lib/const/auth/auth.const.js";

/**
 * A rough 0–4 strength for the password meter, on zxcvbn's scale so the two
 * read alike. It is a hint, not the rule: zxcvbn and its dictionaries are
 * several megabytes, so they stay on the server
 * (`#lib/server/utils/password_strength.util.ts`), which gives the verdict
 * when the form is submitted. Nothing should refuse a password on this score.
 *
 * Bits are length × log2 of the character pool, with repeated characters,
 * runs (`abc`, `321`) and the most common bases counted once.
 */

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

const COMMON = new RegExp(
  [
    "password",
    "passw0rd",
    "qwerty",
    "asdf",
    "zxcv",
    "letmein",
    "welcome",
    "admin",
    "login",
    "iloveyou",
    "monkey",
    "dragon",
    "football",
    "baseball",
    "sunshine",
    "princess",
  ].join("|"),
  "gi",
);

/** Lower bound of bits for scores 1–4. */
const THRESHOLDS = [28, 40, 55, 70];

const pool_size = (password: string) =>
  (/[a-z]/.test(password) ? 26 : 0) +
  (/[A-Z]/.test(password) ? 26 : 0) +
  (/\d/.test(password) ? 10 : 0) +
  (/[^a-zA-Z\d]/.test(password) ? 33 : 0);

/** Characters that add something: not a repeat or a step of ±1 in a run. */
const effective_length = (password: string) => {
  const points = Array.from(
    password.replace(COMMON, "\0"),
    (char) => char.codePointAt(0) ?? 0,
  );

  return points.filter(
    (point, i) => i === 0 || Math.abs(point - points[i - 1]!) > 1,
  ).length;
};

export const estimate_password_strength = (
  password: string,
): PasswordStrength => {
  if (password.length < AUTH.PASSWORD.MIN_LENGTH) return 0;

  const bits = effective_length(password) * Math.log2(pool_size(password));

  return THRESHOLDS.filter((min) => bits >= min).length as PasswordStrength;
};
