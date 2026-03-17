/**
 * Paystack Payment Remote Functions
 */

import { query } from "$app/server";
import { get_session } from "$lib/server/services/auth.service";
import { PaystackService } from "$lib/server/services/transaction/paystack.transaction.service";
import { z } from "zod";

/**
 * Generate and download transaction invoice PDF
 * Returns a presigned URL for the PDF stored in R2
 */
export const get_transaction_invoice_remote = query(z.uuid(), async (transaction_id) => {
  const session = await get_session();
  if (!session.ok) return session;

  const res = await PaystackService.get_transaction_invoice(transaction_id, session.data);

  return res;
});
