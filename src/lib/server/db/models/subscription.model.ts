import { SUBSCRIPTION } from "$lib/const/subscription.const";
import { TRANSACTION } from "$lib/const/transaction.const";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { UserTable } from "./auth.model";
import { Schema } from "./index.schema";

export const subscription_status_enum = pgEnum(
  "subscription_status",
  SUBSCRIPTION.STATUS.IDS,
);

export const SubscriptionTable = pgTable("subscription", {
  ...Schema.id(),

  /** The ID of the subscription group. */
  groupId: text(),
  /** The number of seats purchased. */
  seats: integer(),
  /** Lowercased name of the active plan. */
  plan: varchar({ length: 255 }).notNull(),
  /** active, trialing, canceled, incomplete. */
  status: subscription_status_enum().notNull().default("incomplete"),

  /** Associated User ID or Organization ID. */
  referenceId: uuid().notNull(),

  /** The Paystack customer code for this subscription. */
  paystackCustomerCode: text(),
  /** The unique code for the subscription (e.g., SUB_...). */
  paystackSubscriptionCode: text(),
  /** The reference of the transaction that started the subscription. */
  paystackTransactionReference: text(),

  /** Start date of the current billing period. */
  periodStart: timestamp({ mode: "date" }),
  /** End date of the current billing period. */
  periodEnd: timestamp({ mode: "date" }),
  /** Start date of the trial period. */
  trialStart: timestamp({ mode: "date" }),
  /** End date of the trial period. */
  trialEnd: timestamp({ mode: "date" }),
  /** Whether to cancel at the end of the current period. */
  cancelAtPeriodEnd: boolean().default(false),
});

export type Subscription = typeof SubscriptionTable.$inferSelect;

export const paystack_transaction_status_enum = pgEnum(
  "paystack_transaction_status",
  TRANSACTION.STATUS.IDS,
);

export const PaystackTransactionTable = pgTable(
  "paystack_transaction",
  {
    ...Schema.id(),

    /** The internal Paystack ID for the transaction. */
    paystackId: text(),
    /** Unique transaction reference. */
    reference: text().notNull(),
    /** Associated User ID or Organization ID. */
    referenceId: uuid().notNull(),
    /** The ID of the user who initiated the transaction. */
    userId: uuid()
      .references(() => UserTable.id, { onDelete: "cascade" })
      .notNull(),

    /** Transaction amount in smallest currency unit. */
    amount: integer(),
    /** Currency code (e.g., "NGN"). */
    currency: text().notNull(),
    /** success, pending, failed, abandoned. */
    status: paystack_transaction_status_enum().notNull(),
    /** Name of the plan associated with the transaction. */
    plan: varchar({ length: 255 }),
    /** JSON string of extra transaction metadata. */
    metadata: text(),

    ...Schema.timestamps,
  },
  (table) => [index("paystack_transaction_reference_idx").on(table.reference)],
);

export type PaystackTransaction = typeof PaystackTransactionTable.$inferSelect;
