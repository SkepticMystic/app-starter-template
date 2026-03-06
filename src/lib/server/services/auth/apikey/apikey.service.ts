import { getRequestEvent } from "$app/server";
import { auth, is_ba_error_code } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import type { ApiKey } from "@better-auth/api-key";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";

const log = Log.child({ service: "APIKey" });

const create = async (
  input: {
    name?: string;
    expiresIn?: number;
  },
  session: App.Session,
): Promise<App.Result<ApiKey>> => {
  const l = log.child({ method: "create" });

  try {
    if (!session.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

    const res = await auth.api.createApiKey({
      headers: getRequestEvent().request.headers,

      body: {
        // configId,

        name: input.name,
        expiresIn: input.expiresIn,

        // userId: "user-id", // server-only
        organizationId: session.session.org_id,

        // NOTE: Set by plugin settings default
        // prefix: "sk_",

        // metadata: { someKey: "someValue" },

        // remaining: 100, // server-only
        // refillAmount: 100, // server-only
        // refillInterval: 1000, // server-only
        // rateLimitTimeWindow: 1000, // server-only
        // rateLimitMax: 100, // server-only
        // rateLimitEnabled: true, // server-only

        // permissions, // server-only
      },
    });

    return result.suc(res);
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      if (is_ba_error_code(error, "NAME_REQUIRED")) {
        return result.from_ba_error(error, { path: ["name"] });
      }

      captureException(error);

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to create API key",
      });
    }
  }
};

const update = async (
  apikey_id: string,
  input: {
    name?: string;
    expiresIn?: number;
  },
  _session: App.Session,
): Promise<App.Result<Omit<ApiKey, "key">>> => {
  const l = log.child({ method: "update" });

  try {
    const res = await auth.api.updateApiKey({
      headers: getRequestEvent().request.headers,

      body: {
        // configId,

        keyId: apikey_id,
        name: input.name,
        expiresIn: input.expiresIn,

        // NOTE: Derived from headers, if available
        // userId: "user-id", // server-only
        // organizationId: "org-id",

        // NOTE: Set by plugin settings default
        // prefix: "sk_",

        // metadata: { someKey: "someValue" },

        // remaining: 100, // server-only
        // refillAmount: 100, // server-only
        // refillInterval: 1000, // server-only
        // rateLimitTimeWindow: 1000, // server-only
        // rateLimitMax: 100, // server-only
        // rateLimitEnabled: true, // server-only

        // permissions, // server-only
      },
    });

    return result.suc(res);
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
        message: "Failed to update API key",
      });
    }
  }
};

const verify = async (input: {
  key: string;
  configId?: string;
}): Promise<App.Result<Omit<ApiKey, "key"> | null>> => {
  const l = log.child({ method: "verify" });

  try {
    const data = await auth.api.verifyApiKey({
      headers: getRequestEvent().request.headers,
      body: {
        key: input.key,
        configId: input.configId,
        // permissions,
      },
    });

    // {
    //   valid: boolean;
    //   error: { message: string; code: string } | null;
    //   key: Omit<ApiKey, "key"> | null;
    // };

    if (data.valid) {
      return result.suc(data.key);
    } else if (data.error) {
      return result.err(data.error);
    } else {
      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to verify API key",
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
        message: "Failed to verify API key",
      });
    }
  }
};

const del = async (
  input: {
    configId?: string;
    keyId: string;
  },
  session: App.Session,
): Promise<App.Result<undefined>> => {
  const l = log.child({ method: "delete" });

  try {
    const data = await auth.api.deleteApiKey({
      headers: getRequestEvent().request.headers,
      body: {
        keyId: input.keyId,
        configId: input.configId,
      },
    });

    if (data.success) {
      return result.suc();
    } else {
      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to delete API key",
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
        message: "Failed to delete API key",
      });
    }
  }
};

export const APIKeyService = {
  create,
  update,
  verify,
  delete: del,
};
