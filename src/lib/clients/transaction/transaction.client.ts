import { get_transaction_invoice_remote } from "#lib/remote/transaction/transaction.remote.js";
import { Client } from "../index.client.js";

export const TransactionClient = {
  /** Generate the invoice PDF server-side and open it in a new tab. */
  open_invoice: Client.wrap(
    async (transaction_id: string) => {
      // Opened before the await, while the click still counts as a user
      // gesture; a `window.open` after it is blocked as a popup.
      const tab = window.open("about:blank", "_blank");
      // What `noopener` would do, without losing the handle to navigate it.
      if (tab) tab.opener = null;

      const res = await get_transaction_invoice_remote(transaction_id);
      if (res.ok && tab) tab.location.href = res.data;
      else tab?.close();

      return res;
    },
    { suc_msg: "Invoice ready" },
  ),
};
