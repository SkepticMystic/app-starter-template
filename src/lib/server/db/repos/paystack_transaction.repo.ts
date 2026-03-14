import { db } from "$lib/server/db/drizzle.db";
import { type PaystackTransaction } from "../models/subscription.model";
import { Repo } from "./index.repo";

/**
 * PaystackTransaction Repository - CRUD operations for Paystack transactions
 *
 * Pure database operations without org-scoping.
 * Org-scoping is handled at service layer via authorization.
 * Uses Repo wrapper for consistent error handling.
 */

const get_by_id = async (
  id: string,
): Promise<App.Result<PaystackTransaction | undefined>> => {
  return await Repo.query(
    db.query.paystack_transaction.findFirst({
      where: { id },
    }),
  );
};

export const PaystackTransactionRepo = {
  get_by_id,
};
