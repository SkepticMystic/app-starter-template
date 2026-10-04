import { guarded_command, ORG } from "#lib/server/remote/guarded.js";
import { RateLimiter } from "#lib/server/services/rate_limit/rate_limit.service.js";
import { PaystackService } from "#lib/server/services/transaction/paystack.transaction.service.js";
import { z } from "zod";

// Each call renders a PDF and uploads it to R2.
const invoice_limiter = new RateLimiter("transaction:invoice", {
  max_tokens: 10,
  refill_rate: 10,
  refill_interval: 60,
});

/**
 * Generate a transaction's invoice PDF and answer a presigned URL to it.
 * A command, not a query: it is fired by a click, and a cached query would
 * hand back a presigned URL that may have expired.
 */
export const get_transaction_invoice_remote = guarded_command(
  {
    ...ORG,
    limit: {
      limiter: invoice_limiter,
      by: "org",
      message: "Too many invoice downloads.",
    },
  },
  z.uuid(),
  async (transaction_id, { session }) =>
    PaystackService.get_transaction_invoice(transaction_id, session),
);
