import { form, getRequestEvent } from "$app/server";
import { auth, is_ba_error_code } from "$lib/auth";
import { TWO_FACTOR } from "$lib/const/auth/two_factor.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { invalid } from "@sveltejs/kit";
import { APIError } from "better-auth";
import { TWO_FACTOR_ERROR_CODES } from "better-auth/plugins";
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "bits-ui";
import z from "zod";
import { ERROR } from "$lib/const/error.const";

export const enable_two_factor_remote = form(
  z.object({ password: z.string().min(1, "Please enter your password") }),
  async (input, issue) => {
    try {
      const res = await auth.api.enableTwoFactor({
        body: { password: input.password },
        headers: getRequestEvent().request.headers,
      });

      return result.suc(res);
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "enable_two_factor_remote.error better-auth");

        if (is_ba_error_code(error, "INVALID_PASSWORD")) {
          invalid(issue.password(error.message));
        }

        return result.err({ message: error.message });
      } else {
        Log.error(error, "enable_two_factor_remote.error unknown");

        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }
  },
);

export const disable_two_factor_remote = form(
  z.object({ password: z.string().min(1, "Please enter your password") }),
  async (input, issue) => {
    try {
      const res = await auth.api.disableTwoFactor({
        body: { password: input.password },
        headers: getRequestEvent().request.headers,
      });

      return result.suc(res);
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "disable_two_factor_remote.error better-auth");

        if (is_ba_error_code(error, "INVALID_PASSWORD")) {
          invalid(issue.password(error.message));
        }

        return result.err({ message: error.message });
      } else {
        Log.error(error, "disable_two_factor_remote.error unknown");
        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }
  },
);

export const verify_totp_remote = form(
  z.object({
    code: z
      .string()
      .min(1, TWO_FACTOR_ERROR_CODES.INVALID_CODE)
      .max(TWO_FACTOR.TOTP.DIGITS, TWO_FACTOR_ERROR_CODES.INVALID_CODE)
      .regex(
        new RegExp(REGEXP_ONLY_DIGITS),
        TWO_FACTOR_ERROR_CODES.INVALID_CODE,
      ),
    trust_device: z.boolean().default(false),
  }),
  async (input, issue) => {
    try {
      const res = await auth.api.verifyTOTP({
        headers: getRequestEvent().request.headers,
        body: {
          code: input.code,
          trustDevice: input.trust_device,
        },
      });

      return result.suc(res);
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "verify_totp_remote.error better-auth");

        if (is_ba_error_code(error, "INVALID_CODE")) {
          invalid(issue.code(error.message));
        }

        return result.err({ message: error.message });
      } else {
        Log.error(error, "verify_totp_remote.error unknown");

        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }
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
  }),
  async (input, issue) => {
    try {
      const res = await auth.api.verifyBackupCode({
        headers: getRequestEvent().request.headers,
        body: {
          code: input.code,
          trustDevice: input.trust_device,
        },
      });

      return result.suc(res);
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(
          error.body,
          "verify_two_factor_backup_code_remote.error better-auth",
        );

        if (is_ba_error_code(error, "INVALID_BACKUP_CODE")) {
          invalid(issue.code(error.message));
        }

        return result.err({ message: error.message });
      } else {
        Log.error(error, "verify_two_factor_backup_code_remote.error unknown");

        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }
  },
);
