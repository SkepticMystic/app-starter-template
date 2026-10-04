import { auth, is_ba_error_code } from "#lib/auth.js";
import { EMAIL_OTP } from "#lib/const/auth/email_otp.const.js";
import { ERROR } from "#lib/const/error.const.js";
import { redirect_uri_schema } from "#lib/schema/auth/redirect_uri.schema.js";
import {
  existing_password_schema,
  password_schema,
} from "#lib/schema/password/password.schema.js";
import { AdapterService } from "#lib/server/services/adapter/adapter.service.js";
import { EmailValidationService } from "#lib/server/services/auth/email/email_validation.service.js";
import { CaptchaService } from "#lib/server/services/captcha/captcha.service.js";
import { RateLimiter } from "#lib/server/services/rate_limit/rate_limit.service.js";
import { HashUtil } from "#lib/server/utils/hash.util.js";
import { App } from "#lib/utils/app.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { form, getRequestEvent } from "$app/server";
import type { ResolvedPathname } from "$app/types";
import { captureException } from "@sentry/sveltekit";
import { invalid, isValidationError, redirect } from "@sveltejs/kit";
import { APIError } from "better-auth";
import { REGEXP_ONLY_DIGITS } from "bits-ui";
import { z } from "zod";

/**
 * Credential sign-in has no rate limit of its own without these.
 *
 * Better-Auth's limiter runs on its router's `onRequest`, and this code calls
 * `auth.api.signInEmail` directly rather than going through the router — so the
 * default on `/sign-in/email` never applies here, and nothing replaced it.
 *
 * Two buckets, because they answer different abuses. Per-IP is checked BEFORE
 * the password hash, so a flood costs us a Redis read rather than a KDF run.
 * Per-account is spent only on a wrong password, so a user repeatedly signing
 * in correctly is never throttled, while an attacker working one address is.
 */
const signin_ip_limiter = new RateLimiter("auth:signin:ip", {
  max_tokens: 20,
  refill_rate: 20,
  refill_interval: 60,
});

const signin_account_limiter = new RateLimiter("auth:signin:account", {
  max_tokens: 10,
  refill_rate: 10,
  refill_interval: 900,
});

export const signin_credentials_remote = form(
  z.object({
    email: z.email("Please enter a valid email address"),
    password: existing_password_schema,
    remember: z.boolean().default(false),
    redirect_uri: redirect_uri_schema(),
  }),
  async (input) => {
    let redirect_uri = input.redirect_uri as ResolvedPathname;

    const ip = AdapterService.get_ip();
    if (ip) {
      const rate = await signin_ip_limiter.enforce(ip, {
        message: "Too many sign-in attempts.",
      });
      if (!rate.ok) return rate;
    }

    const key = await HashUtil.email_key(input.email);

    // Checked without spending: the token is charged below, and only when the
    // password was actually wrong.
    const account_rate = await signin_account_limiter.precheck(key, {
      message: "Too many sign-in attempts for this account.",
    });
    if (!account_rate.ok) return account_rate;

    try {
      const res = await auth.api.signInEmail({
        body: {
          email: input.email,
          password: input.password,
          rememberMe: input.remember,
        },
        headers: getRequestEvent().request.headers,
      });

      // WARN: When you call auth.api.signInEmail on the server,
      // and the user has 2FA enabled, it will return an object where twoFactorRedirect is set to true.
      // This behavior isn’t inferred in TypeScript, which can be misleading.
      // You can check using in instead to check if twoFactorRedirect is set to true.
      // SOURCE: https://www.better-auth.com/docs/plugins/2fa#sign-in-with-2fa
      if ("twoFactorRedirect" in res && res.twoFactorRedirect === true) {
        redirect_uri = App.url("/auth/two-factor", { redirect_uri });
      }
    } catch (error) {
      if (error instanceof APIError) {
        if (is_ba_error_code(error, "INVALID_EMAIL_OR_PASSWORD")) {
          // Only a wrong password pays, so correct sign-ins never throttle.
          await signin_account_limiter.enforce(key);

          invalid(error.message);
        }

        Log.info(error.body, "signin_remote.error better-auth");

        captureException(error);

        return result.from_ba_error(error);
      } else {
        Log.error(error, "signin_remote.error unknown");

        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }

    redirect(302, redirect_uri);
  },
);

/**
 * Signing up hashes a password, looks up MX records and sends a verification
 * email, and `auth.api.signUpEmail` skips the router's limiter. Per-IP caps a
 * flood; per-address keeps one inbox from being sent verification emails.
 */
const signup_ip_limiter = new RateLimiter("auth:signup:ip", {
  max_tokens: 10,
  refill_rate: 10,
  refill_interval: 3600,
});

const signup_address_limiter = new RateLimiter("auth:signup:address", {
  max_tokens: 3,
  refill_rate: 3,
  refill_interval: 3600,
});

export const signup_credentials_remote = form(
  z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: z
      .email("Please enter a valid email address")
      .brand<"EmailAddress">(),
    password: password_schema,
    remember: z.boolean().default(false),
    redirect_uri: redirect_uri_schema(),
    captcha_token: z.string().min(1, "Please complete the captcha"),
  }),
  async (input, issue) => {
    try {
      const ip = AdapterService.get_ip();
      if (ip) {
        const rate = await signup_ip_limiter.enforce(ip, {
          message: "Too many sign-up attempts.",
        });
        if (!rate.ok) return rate;
      }

      const captcha = await CaptchaService.verify(input.captcha_token);
      if (!captcha.ok) return captcha;

      const address_rate = await signup_address_limiter.enforce(
        await HashUtil.email_key(input.email),
        { message: "Too many sign-up attempts for this address." },
      );
      if (!address_rate.ok) return address_rate;

      const refused = await EmailValidationService.refusal(input.email);
      if (!refused.ok) {
        return refused;
      } else if (refused.data) {
        invalid(issue.email(refused.data));
      }

      await auth.api.signUpEmail({
        headers: getRequestEvent().request.headers,
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
          rememberMe: input.remember,
          callbackURL: input.redirect_uri,
        },
      });
    } catch (error) {
      if (isValidationError(error)) {
        throw error;
      }

      if (error instanceof APIError) {
        Log.info(error.body, "signup_remote.error better-auth");

        if (is_ba_error_code(error, "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")) {
          invalid(issue.email(error.message));
        } else if (
          is_ba_error_code(
            error,
            "PASSWORD_TOO_LONG",
            "PASSWORD_TOO_SHORT",
            "PASSWORD_COMPROMISED",
          )
        ) {
          invalid(issue.password(error.message));
        } else {
          captureException(error);

          return result.from_ba_error(error);
        }
      } else {
        Log.error(error, "signup_remote.error unknown");

        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }

    redirect(302, "/auth/verify-email");
  },
);

/**
 * Asking for a sign-in code sends an email, so it is limited per IP and, to
 * keep it from being turned on one inbox, per address. Both are spent on the
 * attempt, not the outcome: the answer is the same whether or not the address
 * has an account.
 */
const signin_code_ip_limiter = new RateLimiter("auth:signin_code:ip", {
  max_tokens: 10,
  refill_rate: 10,
  refill_interval: 600,
});

const signin_code_address_limiter = new RateLimiter(
  "auth:signin_code:address",
  {
    max_tokens: 3,
    refill_rate: 3,
    refill_interval: 600,
  },
);

/**
 * Redeeming a code. Better-Auth's `allowedAttempts` caps guesses per code;
 * this caps them per IP across codes and addresses.
 */
const signin_code_verify_limiter = new RateLimiter(
  "auth:signin_code:verify:ip",
  { max_tokens: 20, refill_rate: 20, refill_interval: 600 },
);

export const send_signin_code_remote = form(
  z.object({
    email: z.email("Please enter a valid email address"),
    captcha_token: z.string().min(1, "Please complete the captcha"),
  }),
  async (input) => {
    const ip = AdapterService.get_ip();
    if (ip) {
      const rate = await signin_code_ip_limiter.enforce(ip, {
        message: "Too many sign-in codes requested.",
      });
      if (!rate.ok) return rate;
    }

    const captcha = await CaptchaService.verify(input.captcha_token);
    if (!captcha.ok) return captcha;

    const address_rate = await signin_code_address_limiter.enforce(
      await HashUtil.email_key(input.email),
      { message: "Too many sign-in codes requested for this address." },
    );
    if (!address_rate.ok) return address_rate;

    try {
      // Answers `{ success: true }` for an unknown address too, sending nothing.
      await auth.api.sendVerificationOTP({
        body: { email: input.email, type: "sign-in" },
        headers: getRequestEvent().request.headers,
      });
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "send_signin_code_remote.error better-auth");
        if (error.statusCode >= 500) captureException(error);

        return result.from_ba_error(error);
      }

      Log.error(error, "send_signin_code_remote.error unknown");
      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }

    return result.suc({ email: input.email.trim().toLowerCase() });
  },
);

export const signin_code_remote = form(
  z.object({
    email: z.email("Please enter a valid email address"),
    code: z
      .string()
      .length(EMAIL_OTP.LENGTH, `Enter the ${EMAIL_OTP.LENGTH}-digit code`)
      .regex(
        new RegExp(REGEXP_ONLY_DIGITS),
        `Enter the ${EMAIL_OTP.LENGTH}-digit code`,
      ),
    redirect_uri: redirect_uri_schema(),
  }),
  async (input, issue) => {
    const ip = AdapterService.get_ip();
    if (ip) {
      const rate = await signin_code_verify_limiter.enforce(ip, {
        message: "Too many sign-in attempts.",
      });
      if (!rate.ok) return rate;
    }

    try {
      await auth.api.signInEmailOTP({
        body: { email: input.email, otp: input.code },
        headers: getRequestEvent().request.headers,
      });
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "signin_code_remote.error better-auth");

        if (error.body?.code === EMAIL_OTP.ERRORS.TWO_FACTOR_REQUIRED.code) {
          return result.err({
            ...ERROR.FORBIDDEN,
            message: EMAIL_OTP.ERRORS.TWO_FACTOR_REQUIRED.message,
          });
        } else if (is_ba_error_code(error, "INVALID_OTP")) {
          invalid(
            issue.code("That code is wrong. Check the email and try again."),
          );
        } else if (is_ba_error_code(error, "OTP_EXPIRED")) {
          invalid(issue.code("That code has expired. Send a new one."));
        } else if (is_ba_error_code(error, "TOO_MANY_ATTEMPTS")) {
          invalid(issue.code("Too many wrong codes. Send a new one."));
        }

        if (error.statusCode >= 500) captureException(error);

        return result.from_ba_error(error);
      }

      Log.error(error, "signin_code_remote.error unknown");
      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }

    redirect(302, input.redirect_uri);
  },
);
