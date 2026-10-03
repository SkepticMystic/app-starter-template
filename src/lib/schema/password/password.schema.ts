import { AUTH } from "#lib/const/auth/auth.const.js";
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import { z } from "zod";

const zxcvbn = new ZxcvbnFactory();

const too_long = `Passwords can be at most ${AUTH.PASSWORD.MAX_LENGTH} characters`;

/** A password being set: sign-up, reset, change. */
export const password_schema = z
  .string()
  .min(
    AUTH.PASSWORD.MIN_LENGTH,
    `Passwords must be at least ${AUTH.PASSWORD.MIN_LENGTH} characters`,
  )
  .max(AUTH.PASSWORD.MAX_LENGTH, too_long)
  .refine(
    (s) => zxcvbn.check(s).score >= AUTH.PASSWORD.MIN_SCORE,
    "Please choose a stronger password",
  );

/**
 * A password being checked. No minimum, so a password set under a laxer rule
 * still works. The maximum is refused here because Better-Auth answers
 * `PASSWORD_TOO_LONG` before comparing, which callers don't handle.
 */
export const existing_password_schema = z
  .string()
  .max(AUTH.PASSWORD.MAX_LENGTH, too_long);
