import { db } from "$lib/server/db/drizzle.db";
import { eq } from "drizzle-orm";
import {
  SubscriptionTable,
  type Subscription,
} from "../models/subscription.model";
import { Repo } from "./index.repo";

/**
 * Subscription Repository - CRUD operations for subscriptions
 *
 * Pure database operations without org-scoping.
 * Org-scoping is handled at service layer via authorization.
 * Uses Repo wrapper for consistent error handling.
 */

const get_by_id = async (
  subscription_id: string,
): Promise<App.Result<Subscription | undefined>> => {
  return await Repo.query(
    db.query.subscription.findFirst({
      where: { id: subscription_id },
    }),
  );
};

/**
 * Create a new subscription
 */
const create = async (
  input: typeof SubscriptionTable.$inferInsert,
): Promise<App.Result<Subscription>> => {
  return Repo.insert_one(
    db.insert(SubscriptionTable).values(input).returning(),
  );
};

const update_by_id = async (
  subscription_id: string,
  input: Partial<Subscription>,
): Promise<App.Result<Subscription>> => {
  return await Repo.update_one(
    db
      .update(SubscriptionTable)
      .set(input)
      .where(eq(SubscriptionTable.id, subscription_id))
      .returning(),
  );
};

const update_by_reference = async (
  reference: string,
  input: Partial<Subscription>,
): Promise<App.Result<Subscription>> => {
  return await Repo.update_one(
    db
      .update(SubscriptionTable)
      .set(input)
      .where(eq(SubscriptionTable.paystackTransactionReference, reference))
      .returning(),
  );
};

export const SubscriptionRepo = {
  get_by_id,
  create,
  update_by_id,
  update_by_reference,
};
