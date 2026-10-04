import { db } from "#lib/server/db/drizzle.db.js";
import { eq } from "drizzle-orm";
import {
  SubscriptionTable,
  type Subscription,
} from "../models/subscription.model.js";
import { Repo } from "./index.repo.js";

/**
 * Pure database operations without org-scoping: the service layer checks the
 * row's `referenceId` against the session's org.
 */

const get_by_id = async (
  subscription_id: string,
): Promise<App.Result<Subscription | undefined>> =>
  Repo.query(
    db.query.paystackSubscription.findFirst({
      where: { id: subscription_id },
    }),
  );

/** The identity columns are left out, so a patch cannot move a row to another org. */
const update_by_id = async (
  subscription_id: string,
  input: Partial<Omit<Subscription, "id" | "referenceId" | "userId">>,
): Promise<App.Result<Subscription>> =>
  Repo.update_one(
    db
      .update(SubscriptionTable)
      .set(input)
      .where(eq(SubscriptionTable.id, subscription_id))
      .returning(),
  );

export const SubscriptionRepo = {
  get_by_id,
  update_by_id,
};
