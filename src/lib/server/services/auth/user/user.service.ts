import { getRequestEvent } from "$app/server";
import { ServiceUtil } from "#lib/server/services/service.util.js";
import { auth, is_ba_error_code } from "#lib/auth.js";
import { ERROR } from "#lib/const/error.const.js";
import { App } from "#lib/utils/app.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { captureException } from "@sentry/sveltekit";
import { APIError, type User } from "better-auth";
import { AIModerationService } from "../../moderation/ai.moderation.service.js";

const log = Log.child({ service: "User" });

const TRUSTED_IMAGE_HOSTS = new Set(["api.dicebear.com"]);

const moderate = async (input: {
  image: string | null | undefined;
}): Promise<App.Result<undefined>> => {
  const l = log.child({ method: "moderate" });

  try {
    if (!input.image) {
      return result.suc(undefined);
    }

    const url = new URL(input.image);
    if (TRUSTED_IMAGE_HOSTS.has(url.host)) {
      return result.suc(undefined);
    }

    const moderation = await AIModerationService.image(input.image);
    if (!moderation.ok) {
      return moderation;
    } else if (moderation.data.flagged) {
      return result.err({
        ...ERROR.INVALID_INPUT,
        path: ["image"],
        message: "This image isn't allowed. Please choose another",
      });
    }

    return result.suc(undefined);
  } catch (error) {
    l.error(error, "error unknown");

    captureException(error, { contexts: { moderate: { input } } });

    return result.err({
      ...ERROR.INTERNAL_SERVER_ERROR,
      message: "Failed to moderate image",
    });
  }
};

const update = async (
  input: Pick<User, "name" | "image">,
): Promise<App.Result<undefined>> => {
  const l = log.child({ method: "update" });

  try {
    const moderation = await moderate({ image: input.image });
    if (!moderation.ok) return moderation;

    const res = await auth.api.updateUser({
      headers: getRequestEvent().request.headers,
      body: {
        name: input.name,
        image: input.image,
      },
    });

    if (res.status) {
      return result.suc(undefined);
    } else {
      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to update user",
      });
    }
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      captureException(error);

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to update user",
      });
    }
  }
};

const request_password_reset = async (input: {
  email: string;
}): Promise<App.Result<{ message: string }>> => {
  const l = log.child({ method: "request_password_reset" });

  try {
    const res = await auth.api.requestPasswordReset({
      body: {
        email: input.email,
        redirectTo: App.url("/auth/reset-password"),
      },
      headers: getRequestEvent().request.headers,
    });

    // NOTE: We return the BA message here, even in the success case, because
    // we don't want to reveal if the email exists or not
    return res.status
      ? result.suc({ message: res.message })
      : result.err({
          status: 500,
          message: res.message ?? "Failed to request password reset",
        });
  } catch (error) {
    return ServiceUtil.ba_error(error, { log: l });
  }
};

const reset_password = async (input: {
  token: string;
  new_password: string;
}): Promise<App.Result<undefined>> => {
  const l = log.child({ method: "reset_password" });

  try {
    const res = await auth.api.resetPassword({
      headers: getRequestEvent().request.headers,
      body: {
        token: input.token,
        newPassword: input.new_password,
      },
    });

    return res.status
      ? result.suc(undefined)
      : result.err({
          ...ERROR.INTERNAL_SERVER_ERROR,
          message: "Failed to reset password",
        });
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      if (
        is_ba_error_code(
          error,
          "PASSWORD_TOO_LONG",
          "PASSWORD_TOO_SHORT",
          "PASSWORD_COMPROMISED",
        )
      ) {
        return result.from_ba_error(error, { path: ["new_password"] });
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

const change_password = async (input: {
  new_password: string;
  current_password: string;
}): Promise<App.Result<undefined>> => {
  const l = log.child({ method: "change_password" });

  try {
    const res = await auth.api.changePassword({
      headers: getRequestEvent().request.headers,
      body: {
        revokeOtherSessions: true,
        newPassword: input.new_password,
        currentPassword: input.current_password,
      },
    });

    // `res` carries the new session token, so it is never logged.
    return res.user
      ? result.suc(undefined)
      : result.err(ERROR.INTERNAL_SERVER_ERROR);
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      if (is_ba_error_code(error, "INVALID_PASSWORD")) {
        return result.from_ba_error(error, { path: ["current_password"] });
      } else if (
        is_ba_error_code(
          error,
          "PASSWORD_TOO_LONG",
          "PASSWORD_TOO_SHORT",
          "PASSWORD_COMPROMISED",
        )
      ) {
        return result.from_ba_error(error, { path: ["new_password"] });
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

const send_verification_email = async (input: {
  email: string;
  redirect_uri: string;
}): Promise<App.Result<{ message: string }>> => {
  const l = log.child({ method: "send_verification_email" });

  try {
    const res = await auth.api.sendVerificationEmail({
      headers: getRequestEvent().request.headers,
      body: {
        email: input.email,
        callbackURL: input.redirect_uri,
      },
    });

    return res.status
      ? result.suc({ message: "Verification email sent" })
      : result.err({
          status: 500,
          message: "Failed to send verification email",
        });
  } catch (error) {
    return ServiceUtil.ba_error(error, { log: l });
  }
};

/**
 * Starts the change; nothing moves until a link is followed. A verified user
 * approves from their current address first (`changeEmail` in `auth.ts`).
 * Better-Auth answers success for an address that is already taken too, so
 * the response says nothing about who has an account.
 */
const change_email = async (input: {
  new_email: string;
}): Promise<App.Result<{ message: string }>> => {
  const l = log.child({ method: "change_email" });

  try {
    const res = await auth.api.changeEmail({
      headers: getRequestEvent().request.headers,
      body: {
        newEmail: input.new_email,
        callbackURL: App.url("/settings/account"),
      },
    });

    return res.status
      ? result.suc({ message: "Check your inbox to approve the change" })
      : result.err({
          ...ERROR.INTERNAL_SERVER_ERROR,
          message: "Failed to start the email change",
        });
  } catch (error) {
    if (
      error instanceof APIError &&
      is_ba_error_code(
        error,
        "USER_ALREADY_EXISTS",
        "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
        "EMAIL_CAN_NOT_BE_UPDATED",
      )
    ) {
      l.info(error.body, "error better-auth");

      return result.from_ba_error(error, { path: ["new_email"] });
    }

    return ServiceUtil.ba_error(error, { log: l });
  }
};

export const UserService = {
  update,
  change_email,
  send_verification_email,
  request_password_reset,
  reset_password,
  change_password,
};
