import { form } from "$app/server";
import { guarded_form, USER } from "#lib/server/remote/guarded.js";
import { AdapterService } from "#lib/server/services/adapter/adapter.service.js";
import { RateLimiter } from "#lib/server/services/rate_limit/rate_limit.service.js";
import { TWO_FACTOR } from "#lib/const/auth/two_factor.const.js";
import { existing_password_schema } from "#lib/schema/password/password.schema.js";
import { TwoFactorService } from "#lib/server/services/auth/two_factor/two_factor.service.js";
import { CaptchaService } from "#lib/server/services/captcha/captcha.service.js";
import { invalid } from "@sveltejs/kit";
import { TWO_FACTOR_ERROR_CODES } from "better-auth/plugins";
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "bits-ui";
import { z } from "zod";

/**
 * The verify forms run mid-sign-in, before there is a session to guard on, and
 * call Better-Auth directly, past its router limit. Better-Auth's own lockout
 * still caps guesses per account; this caps them per IP.
 */
const verify_limiter = new RateLimiter("two_factor:verify:ip", {
  max_tokens: 10,
  refill_rate: 10,
  refill_interval: 300,
});

const enforce_verify_limit = async () => {
  const ip = AdapterService.get_ip();
  if (!ip) return undefined;

  const rate = await verify_limiter.enforce(ip, {
    message: "Too many verification attempts.",
  });

  return rate.ok ? undefined : rate;
};

export const enable_two_factor_remote = guarded_form(
  USER,
  z.object({
    password: existing_password_schema.min(1, "Please enter your password"),
  }),
  async (input) => {
    const res = await TwoFactorService.enable(input);
    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

export const disable_two_factor_remote = guarded_form(
  USER,
  z.object({
    password: existing_password_schema.min(1, "Please enter your password"),
    captcha_token: z.string().min(1, "Please complete the captcha"),
  }),
  async (input) => {
    const captcha = await CaptchaService.verify(input.captcha_token);
    if (!captcha.ok) return captcha;

    const res = await TwoFactorService.disable(input);
    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

export const verify_totp_remote = form(
  z.object({
    trust_device: z.boolean().default(false),
    code: z
      .string()
      .length(TWO_FACTOR.TOTP.DIGITS, TWO_FACTOR_ERROR_CODES.INVALID_CODE)
      .regex(
        new RegExp(REGEXP_ONLY_DIGITS),
        TWO_FACTOR_ERROR_CODES.INVALID_CODE,
      ),
  }),
  async (input) => {
    const refused = await enforce_verify_limit();
    if (refused) return refused;

    const res = await TwoFactorService.verify_totp(input);
    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

export const verify_two_factor_backup_code_remote = form(
  z.object({
    code: z
      .string()
      .min(1, TWO_FACTOR_ERROR_CODES.INVALID_BACKUP_CODE)
      .max(64, TWO_FACTOR_ERROR_CODES.INVALID_BACKUP_CODE)
      .regex(
        new RegExp(REGEXP_ONLY_DIGITS_AND_CHARS),
        TWO_FACTOR_ERROR_CODES.INVALID_BACKUP_CODE,
      ),
    trust_device: z.boolean().default(false),
    captcha_token: z.string().min(1, "Please complete the captcha"),
  }),
  async (input) => {
    const refused = await enforce_verify_limit();
    if (refused) return refused;

    const captcha = await CaptchaService.verify(input.captcha_token);
    if (!captcha.ok) return captcha;

    const res = await TwoFactorService.verify_backup_code(input);
    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);
