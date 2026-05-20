import { ERROR } from "$lib/const/error.const";
import type { Branded } from "$lib/interfaces/zod/zod.type";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import dns from "dns/promises";

const log = Log.child({ service: "EmailValidation" });

const has_mx_records = async (email: Branded<"EmailAddress">): Promise<App.Result<boolean>> => {
  try {
    const domain = email.split("@")[1];
    if (!domain)
      return result.err({
        ...ERROR.INVALID_INPUT,
        message: "Invalid email address",
      });

    const records = await dns.resolveMx(domain);

    return result.suc(records.length > 0);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "ENOTFOUND" || error.code === "ENODATA")
    ) {
      // {
      //   "type": "Error",
      //   "message": "queryMx ENOTFOUND {hostname}",
      //   "code": "ENOTFOUND",
      //   "syscall": "queryMx",
      //   "hostname": "{hostname}"
      // }

      // {
      //   "type": "Error",
      //   "message": "queryMx ENODATA t.co",
      //   "code": "ENODATA",
      //   "syscall": "queryMx",
      //   "hostname": "t.co"
      // }

      log.info(
        {
          email,
          code: error.code,
          message: error.message,
        },
        "has_mx_records.error",
      );

      return result.suc(false);
    } else {
      log.error(error, "has_mx_records.error unknown");

      captureException(error, {
        tags: { email: email },
        contexts: { has_mx_records: { email } },
      });

      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to check MX records",
      });
    }
  }
};

export const EmailValidationService = {
  has_mx_records,
};
