import { ERROR } from "#lib/const/error.const.js";
import type { Branded } from "#lib/interfaces/zod/zod.type.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { captureException } from "@sentry/sveltekit";
import { disposableEmailBlocklistSet } from "disposable-email-domains-js";
import dns from "node:dns/promises";

const log = Log.child({ service: "EmailValidation" });

// The package's own lookup rebuilds this set on every call.
const DISPOSABLE_DOMAINS = disposableEmailBlocklistSet();

/**
 * Whether `email` is at a throwaway inbox provider. Its parent domains count
 * too, since some providers hand out any subdomain (`x.mailinator.com`).
 */
const is_disposable = (email: string) => {
  const labels = (email.split("@").at(-1) ?? "")
    .trim()
    .toLowerCase()
    .split(".");

  // Never the bare TLD.
  for (let i = 0; i < labels.length - 1; i++) {
    if (DISPOSABLE_DOMAINS.has(labels.slice(i).join("."))) return true;
  }

  return false;
};

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
          domain: email.split("@").at(-1),
          code: error.code,
          message: error.message,
        },
        "has_mx_records.error",
      );

      return result.suc(false);
    } else {
      log.error(error, "has_mx_records.error unknown");

      captureException(error, {
        contexts: { has_mx_records: { domain: email.split("@").at(-1) } },
      });

      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to check MX records",
      });
    }
  }
};

/**
 * Why `email` cannot be an account's address, or `null` when it can. The
 * disposable list goes first: it is in memory, and the MX lookup is a DNS
 * round trip.
 */
const refusal = async (
  email: Branded<"EmailAddress">,
): Promise<App.Result<string | null>> => {
  if (is_disposable(email)) {
    return result.suc("Disposable email addresses can't be used");
  }

  const mx = await has_mx_records(email);
  if (!mx.ok) return mx;

  return result.suc(mx.data ? null : "Email address is not valid");
};

export const EmailValidationService = {
  is_disposable,
  has_mx_records,
  refusal,
};
