import { form } from "$app/server";
import { TWO_FACTOR } from "$lib/const/auth/two_factor.const";
import { TwoFactorService } from "$lib/server/services/auth/two_factor/two_factor.service";
import { CaptchaService } from "$lib/server/services/captcha/captcha.service";
import { invalid } from "@sveltejs/kit";
import { TWO_FACTOR_ERROR_CODES } from "better-auth/plugins";
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "bits-ui";
import z from "zod";

export const enable_two_factor_remote = form(
  z.object({ password: z.string().min(1, "Please enter your password") }),
  async (input) => {
    const res = await TwoFactorService.enable(input);
    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

export const disable_two_factor_remote = form(
  z.object({
    password: z.string().min(1, "Please enter your password"),
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
      .min(1, TWO_FACTOR_ERROR_CODES.INVALID_CODE)
      .max(TWO_FACTOR.TOTP.DIGITS, TWO_FACTOR_ERROR_CODES.INVALID_CODE)
      .regex(
        new RegExp(REGEXP_ONLY_DIGITS),
        TWO_FACTOR_ERROR_CODES.INVALID_CODE,
      ),
  }),
  async (input) => {
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
      .regex(
        new RegExp(REGEXP_ONLY_DIGITS_AND_CHARS),
        TWO_FACTOR_ERROR_CODES.INVALID_BACKUP_CODE,
      ),
    trust_device: z.boolean().default(false),
    captcha_token: z.string().min(1, "Please complete the captcha"),
  }),
  async (input) => {
    const captcha = await CaptchaService.verify(input.captcha_token);
    if (!captcha.ok) return captcha;

    const res = await TwoFactorService.verify_backup_code(input);
    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);
