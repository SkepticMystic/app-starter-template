import { getRequestEvent } from "$app/server";
import { auth } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import type { PaystackTransaction } from "$lib/server/db/models/subscription.model";
import { PaystackTransactionRepo } from "$lib/server/db/repos/paystack_transaction.repo";
import { Log } from "$lib/utils/logger.util";
import { generate_transaction_pdf } from "$lib/utils/pdf/transaction.pdf.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { waitUntil } from "@vercel/functions";
import { APIError } from "better-auth";
import { R2Service } from "../r2.service";

const log = Log.child({ service: "Paystack" });

const get_by_id = async (
  transaction_id: string,
  session: App.Session,
): Promise<App.Result<PaystackTransaction>> => {
  try {
    const res = await PaystackTransactionRepo.get_by_id(transaction_id);
    if (!res.ok) {
      return res;
    } else if (!res.data) {
      return result.err(ERROR.NOT_FOUND);
    } else if (res.data.referenceId !== session.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

    return result.suc(res.data);
  } catch (error) {
    log.error(error, "get_by_id.error unknown");
    captureException(error);
    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

const initialize_transaction = async (
  input: NonNullable<
    Parameters<(typeof auth.api)["initializeTransaction"]>[0]
  >["body"],
) => {
  const l = log.child({ method: "initialize_transaction" });

  try {
    const data = await auth.api["initializeTransaction"]({
      headers: getRequestEvent().request.headers,
      body: input,
    });

    return result.suc(data);
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

const create_r2_log = async (
  reference: string,
  verify: Awaited<ReturnType<(typeof auth.api)["verifyTransaction"]>>,
) => {
  return R2Service.put({
    body: JSON.stringify(verify),
    content_type: "application/json",
    expires_in: 1_000 * 60 * 60 * 24 * 7, // 1 week
    key: `system/paystack/verify-transaction/${reference}/${Date.now()}`,
  });
};

const get_transaction_invoice = async (
  transaction_id: string,
  session: App.Session,
) => {
  const l = log.child({ method: "get_transaction_invoice" });

  try {
    const transaction = await get_by_id(transaction_id, session);
    if (!transaction.ok) return transaction;

    const pdf = await generate_transaction_pdf({
      transaction: transaction.data,
    });
    if (!pdf.ok) return pdf;

    const storage_key = `transaction/org/${transaction.data.referenceId}/reference/${transaction.data.reference}.pdf`;

    const upload = await R2Service.put({
      key: storage_key,
      body: pdf.data.buffer,
      content_type: pdf.data.content_type,
      content_length: pdf.data.file_size,
      expires_in: 1_000 * 60 * 60 * 24 * 7, // 1 week
    });
    if (!upload.ok) return upload;

    const signed_url = await R2Service.get_signed_url(storage_key);

    return signed_url;
  } catch (error) {
    l.error(error, "error unknown");

    captureException(error);

    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

const verify_transaction = async ({ reference }: { reference: string }) => {
  const l = log.child({ method: "verify_transaction" });

  try {
    const verify = await auth.api["verifyTransaction"]({
      body: { reference },
      headers: getRequestEvent().request.headers,
    });

    waitUntil(create_r2_log(reference, verify));

    l.info(verify, "verify res");
    if (verify.status !== "success") {
      l.warn(verify, "verify.status !== 'success'");
    }

    return result.suc(verify);
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error, "error better-auth");

      captureException(error);

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

export const PaystackService = {
  initialize_transaction,
  verify_transaction,
  get_transaction_invoice,
};
