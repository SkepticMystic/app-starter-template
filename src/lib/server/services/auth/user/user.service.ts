import { getRequestEvent } from "$app/server";
import { auth, is_ba_error_code } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { App } from "$lib/utils/app";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { APIError, type User } from "better-auth";
import { AIModerationService } from "../../moderation/ai.moderation.service";

const log = Log.child({ service: "User" });

const update = async (input: Pick<User, "name" | "image">): Promise<App.Result<undefined>> => {
  const l = log.child({ method: "update" });

  try {
    if (input.image) {
      const moderation = await AIModerationService.image(input.image);
      if (!moderation.ok) return moderation;
      else if (moderation.data.flagged) {
        return result.err({
          ...ERROR.INTERNAL_SERVER_ERROR,
          path: ["image"],
          message: "Image moderation flagged",
        });
      }
    }

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

      captureException(error, { extra: { input } });

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");

      captureException(error, { extra: { input } });

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
          message: res.message ?? "Failed to request password reset",
        });
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      captureException(error);

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
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
        is_ba_error_code(error, "PASSWORD_TOO_LONG", "PASSWORD_TOO_SHORT", "PASSWORD_COMPROMISED")
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

    l.info(res, "res");

    // return res.status
    return result.suc(undefined);
    // : Result.err({ message: "Failed to change password" });
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      if (is_ba_error_code(error, "INVALID_PASSWORD")) {
        return result.from_ba_error(error, { path: ["current_password"] });
      } else if (
        is_ba_error_code(error, "PASSWORD_TOO_LONG", "PASSWORD_TOO_SHORT", "PASSWORD_COMPROMISED")
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
      ? result.suc({
          message: res.message ?? "Verification email sent",
        })
      : result.err({
          message: res.message ?? "Failed to send verification email",
        });
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      captureException(error);

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

export const UserService = {
  update,
  send_verification_email,
  request_password_reset,
  reset_password,
  change_password,
};
