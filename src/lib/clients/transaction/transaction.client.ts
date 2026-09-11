/**
 * Client-side wrappers for payment operations
 */

import { get_transaction_invoice_remote } from "$lib/remote/transaction/transaction.remote";
import { Client } from "../index.client";

export const TransactionClient = {
  /**
   * Generate transaction invoice PDF and open in new tab
   * The PDF is generated server-side, uploaded to R2, and a presigned URL is returned
   */
  open_invoice: Client.wrap(
    (transaction_id: string) =>
      get_transaction_invoice_remote(transaction_id).then((r) => {
        if (r.ok) {
          // `<a target="_blank">` implies noopener; `window.open` does NOT,
          // and would hand the opened document a live `window.opener` here.
          window.open(r.data, "_blank", "noopener");
        }

        return r;
      }),
    { suc_msg: "Transaction invoice generated" },
  ),
};
