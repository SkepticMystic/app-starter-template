/**
 * Paystack Payment Remote Functions
 */

import { query } from "$app/server";
import { ERROR } from "$lib/const/error.const";
import { safe_get_session } from "$lib/server/services/auth.service";
import { PaystackService } from "$lib/server/services/transaction/paystack.transaction.service";
import { result } from "$lib/utils/result.util";
import z from "zod";

/**
 * Generate and download transaction invoice PDF
 * Returns a presigned URL for the PDF stored in R2
 */
export const get_transaction_invoice_remote = query(
  z.uuid(),
  async (transaction_id) => {
    const session = await safe_get_session();
    if (!session) return result.err(ERROR.UNAUTHORIZED);

    const res = await PaystackService.get_transaction_invoice(
      transaction_id,
      session,
    );

    return res;
  },
);
