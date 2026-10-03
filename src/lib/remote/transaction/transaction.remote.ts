/**
 * Paystack Payment Remote Functions
 */

import { guarded_query, USER } from "#lib/server/remote/guarded.js";
import { PaystackService } from "#lib/server/services/transaction/paystack.transaction.service.js";
import { z } from "zod";

/**
 * Generate and download transaction invoice PDF
 * Returns a presigned URL for the PDF stored in R2
 */
export const get_transaction_invoice_remote = guarded_query(
  USER,
  z.uuid(),
  async (transaction_id, { session }) =>
    PaystackService.get_transaction_invoice(transaction_id, session),
);
