import { getRequestEvent } from "$app/server";
import { auth, is_ba_error_code } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";

const log = Log.child({ service: "TwoFactor" });

const enable = async (input: {
  password: string;
}): Promise<App.Result<undefined>> => {
  const l = log.child({ method: "enable" });

  try {
    const res = await auth.api.enableTwoFactor({
      body: { password: input.password },
      headers: getRequestEvent().request.headers,
    });

    return result.suc(res);
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      if (is_ba_error_code(error, "INVALID_PASSWORD")) {
        return result.from_ba_error(error, { path: ["password"] });
      } else {
        captureException(error);

        return result.from_ba_error(error);
      }
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const disable = async (input: {
  password: string;
}): Promise<App.Result<undefined>> => {
  const l = log.child({ method: "disable" });

  try {
    const res = await auth.api.disableTwoFactor({
      body: { password: input.password },
      headers: getRequestEvent().request.headers,
    });

    return result.suc(res);
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      if (is_ba_error_code(error, "INVALID_PASSWORD")) {
        return result.from_ba_error(error, { path: ["password"] });
      } else {
        captureException(error);

        return result.from_ba_error(error);
      }
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const verify_totp = async (input: {
  code: string;
  trust_device: boolean;
}): Promise<App.Result<undefined>> => {
  const l = log.child({ method: "verify_totp" });

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
      l.info(error.body, "error better-auth");

      if (is_ba_error_code(error, "INVALID_CODE")) {
        return result.from_ba_error(error, {
          path: ["code"],
          // NOTE: There doesn't seem to be an actual error message from BA...
          message: error.message || "Invalid code",
        });
      } else {
        captureException(error);

        return result.from_ba_error(error);
      }
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const verify_backup_code = async (input: {
  code: string;
  trust_device: boolean;
}): Promise<App.Result<undefined>> => {
  const l = log.child({ method: "verify_backup_code" });

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
      l.info(error.body, "error better-auth");

      if (is_ba_error_code(error, "INVALID_BACKUP_CODE")) {
        return result.from_ba_error(error, { path: ["code"] });
      } else {
        captureException(error);

        return result.from_ba_error(error);
      }
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

export const TwoFactorService = {
  enable,
  disable,
  verify_totp,
  verify_backup_code,
};
