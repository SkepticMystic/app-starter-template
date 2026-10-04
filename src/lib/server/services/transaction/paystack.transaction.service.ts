import { ServiceUtil } from "#lib/server/services/service.util.js";
import { ERROR } from "#lib/const/error.const.js";
import type { PaystackTransaction } from "#lib/server/db/models/subscription.model.js";
import { PaystackTransactionRepo } from "#lib/server/db/repos/paystack_transaction.repo.js";
import { Log } from "#lib/utils/logger.util.js";
import { generate_transaction_pdf } from "#lib/utils/pdf/transaction.pdf.util.js";
import { result } from "#lib/utils/result.util.js";
import { captureException } from "@sentry/sveltekit";
import { R2Service } from "../storage/r2.storage.service.js";

const log = Log.child({ service: "Paystack" });

const get_by_id = async (
  transaction_id: string,
  session: App.Session,
): Promise<App.Result<PaystackTransaction>> => {
  try {
    if (!session.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

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
    return ServiceUtil.internal(error, { log, scope: "get_by_id" });
  }
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
      http_expires_in: 1_000 * 60 * 60 * 24 * 7, // 1 week
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

export const PaystackService = {
  get_transaction_invoice,
};
