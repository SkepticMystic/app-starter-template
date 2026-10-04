import { TWO_FACTOR } from "./two_factor.const.js";

/** Signing in with a code emailed to the account's address (Better-Auth's `emailOTP`). */
export const EMAIL_OTP = {
  /** The length `InputOtp` draws, which it shares with the 2FA code. */
  LENGTH: TWO_FACTOR.TOTP.DIGITS,
  EXPIRES_IN_SECONDS: 10 * 60,
  /** Wrong guesses before a code is spent and a new one must be sent. */
  ALLOWED_ATTEMPTS: 3,

  ERRORS: {
    /**
     * Ours, not Better-Auth's: `twoFactor` guards only password sign-in, so
     * `auth.ts` refuses a code sign-in to an account that has a second factor.
     */
    TWO_FACTOR_REQUIRED: {
      code: "TWO_FACTOR_REQUIRED",
      message:
        "This account uses two-factor authentication. Sign in with your password or a passkey.",
    },
  },
};
