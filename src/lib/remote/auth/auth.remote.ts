import { form, getRequestEvent } from "$app/server";
import { redirect_uri_schema } from "$lib/schema/auth/redirect_uri.schema";
import type { ResolvedPathname } from "$app/types";
import { auth, is_ba_error_code } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { password_schema } from "$lib/schema/password/password.schema";
import { EmailValidationService } from "$lib/server/services/auth/email/email_validation.service";
import { CaptchaService } from "$lib/server/services/captcha/captcha.service";
import { App } from "$lib/utils/app";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { invalid, isValidationError, redirect } from "@sveltejs/kit";
import { APIError } from "better-auth";
import { RateLimiter } from "$lib/server/services/rate_limit/rate_limit.service";
import { AdapterService } from "$lib/server/services/adapter/adapter.service";
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

/**
 * The address is hashed rather than used directly, so it never reaches Redis —
 * or Upstash's analytics — as plaintext.
 */
const account_key = async (email: string) => {
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export const signin_credentials_remote = form(
  z.object({
    email: z.email("Please enter a valid email address"),
    password: z.string(),
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

    const key = await account_key(input.email);

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
      const captcha = await CaptchaService.verify(input.captcha_token);
      if (!captcha.ok) return captcha;

      const email_valid = await EmailValidationService.has_mx_records(
        input.email,
      );
      if (!email_valid.ok) {
        return email_valid;
      } else if (!email_valid.data) {
        invalid(issue.email("Email address is not valid"));
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
