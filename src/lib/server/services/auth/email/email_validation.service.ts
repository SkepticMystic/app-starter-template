import { ERROR } from "$lib/const/error.const";
import type { Branded } from "$lib/interfaces/zod/zod.type";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import dns from "dns/promises";

const log = Log.child({ service: "EmailValidation" });

const has_mx_records = async (
  email: Branded<"EmailAddress">,
): Promise<App.Result<boolean>> => {
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
      error.code === "ENOTFOUND"
    ) {
      // {
      //   "type": "Error",
      //   "message": "queryMx ENOTFOUND {hostname}",
      //   "code": "ENOTFOUND",
      //   "syscall": "queryMx",
      //   "hostname": "{hostname}"
      // }

      log.info("has_mx_records.error ENOTFOUND: " + email);

      return result.suc(false);
    } else {
      log.error(error, "has_mx_records.error unknown");

      captureException(error, { extra: { email } });

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
