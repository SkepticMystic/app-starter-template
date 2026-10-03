import { PAYSTACK_SECRET_KEY } from "$app/env/private";
import { createPaystack } from "@alexasomba/paystack-node";
import type { PaystackInitializeResult } from "better-auth-paystack";

export const PaystackClient = createPaystack({
  secretKey: PAYSTACK_SECRET_KEY,
});

/**
 * The checkout URL from an initialize/upgrade result, or `null` when there is
 * nowhere to send the buyer.
 *
 * Checks the URL itself and not only `kind`, because the plugin builds the
 * field as `url ?? ""` — so a discriminant-only check happily hands back an
 * empty string and redirects the buyer nowhere. The non-`checkout` arms
 * ("scheduled", "prorated") are real successes that simply have no redirect:
 * Paystack applied the change against the stored authorization.
 */
export const checkout_url = (
  res: PaystackInitializeResult | undefined,
): string | null => (res?.kind === "checkout" && res.url ? res.url : null);
