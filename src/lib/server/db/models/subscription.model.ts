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
import { SUBSCRIPTION } from "../../../const/subscription.const";
import { TRANSACTION } from "../../../const/transaction.const";
import { UserTable } from "./auth.model";
import { Schema } from "./index.schema";

/**
 * These tables are owned by the `better-auth-paystack` plugin, which resolves a
 * model as `schema[model]` and a field as `schemaModel[field]` — the JS property,
 * never the SQL name underneath. So the property names below have to match the
 * plugin's field names exactly, while `text("paystack_customer_code")` keeps the
 * column name this database already has. That split is what let the 2.x -> 3.2
 * rename ship as a code-only change: a revert is the rollback.
 */

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
  /** The user who owns the subscription. Required by the plugin. */
  userId: uuid()
    .references(() => UserTable.id, { onDelete: "cascade" })
    .notNull(),

  /** The Paystack customer code for this subscription. */
  customerCode: text("paystack_customer_code"),
  /** The unique code for the subscription (e.g., SUB_...). */
  subscriptionCode: text("paystack_subscription_code").unique(),
  /** The reference of the transaction that started the subscription. */
  transactionReference: text("paystack_transaction_reference"),
  /** The Paystack plan code backing {@link SubscriptionTable.plan}. */
  planCode: text(),
  /** Set when a plan change is scheduled rather than applied immediately. */
  pendingPlan: text(),
  /** The billing cadence Paystack reports for the active plan. */
  billingInterval: text(),

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
  /** When the subscription is scheduled to cancel. */
  cancelAt: timestamp({ mode: "date" }),
  /** When cancellation was requested. */
  canceledAt: timestamp({ mode: "date" }),
  /** When the subscription actually ended. */
  endedAt: timestamp({ mode: "date" }),

  ...Schema.timestamps,
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
    reference: text().notNull().unique(),
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
    /** success, pending, failed, abandoned, and the rest Paystack may send. */
    status: paystack_transaction_status_enum().notNull(),
    /** Name of the plan associated with the transaction. */
    plan: varchar({ length: 255 }),
    /** Name of the one-off product associated with the transaction. */
    product: varchar({ length: 255 }),
    /** JSON string of extra transaction metadata. */
    metadata: text(),

    ...Schema.timestamps,
  },
  (table) => [index("paystack_transaction_reference_idx").on(table.reference)],
);

export type PaystackTransaction = typeof PaystackTransactionTable.$inferSelect;

/** Maps an owner (user or organization) to its Paystack customer record. */
export const PaystackCustomerTable = pgTable(
  "paystack_customer",
  {
    ...Schema.id(),

    referenceType: text().notNull(),
    referenceId: uuid().notNull(),
    /** `${referenceType}:${referenceId}`, which is what the plugin looks up by. */
    referenceKey: text().notNull().unique(),
    customerCode: text().notNull().unique(),
    email: text(),

    ...Schema.timestamps,
  },
  (table) => [
    index("paystack_customer_reference_id_idx").on(table.referenceId),
  ],
);

export type PaystackCustomer = typeof PaystackCustomerTable.$inferSelect;

/**
 * Encrypted reauthorization material for a subscription. Written only when
 * `credentialEncryptionKey` is configured; the plugin falls back to the API
 * secret key otherwise.
 */
export const PaystackPaymentCredentialTable = pgTable(
  "paystack_payment_credential",
  {
    ...Schema.id(),

    subscriptionId: uuid()
      .references(() => SubscriptionTable.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    authorizationCodeEncrypted: text(),
    emailTokenEncrypted: text(),

    ...Schema.timestamps,
  },
);

export type PaystackPaymentCredential =
  typeof PaystackPaymentCredentialTable.$inferSelect;

/** A recurring plan mirrored from Paystack. */
export const PaystackPlanTable = pgTable("paystack_plan", {
  ...Schema.id(),

  name: text().notNull(),
  description: text(),
  amount: integer().notNull(),
  currency: text().notNull(),
  interval: text().notNull(),
  group: text(),
  planCode: text().notNull().unique(),
  paystackId: text().notNull().unique(),
  metadata: text(),

  ...Schema.timestamps,
});

export type PaystackPlan = typeof PaystackPlanTable.$inferSelect;

/** A one-off product mirrored from Paystack. */
export const PaystackProductTable = pgTable("paystack_product", {
  ...Schema.id(),

  name: text().notNull(),
  description: text(),
  price: integer().notNull(),
  currency: text().notNull(),
  quantity: integer(),
  unlimited: boolean(),
  paystackId: text().unique(),
  slug: text().notNull().unique(),
  metadata: text(),

  ...Schema.timestamps,
});

export type PaystackProduct = typeof PaystackProductTable.$inferSelect;

/**
 * The webhook de-duplication ledger. `eventId` is unique, which is what makes a
 * redelivered Paystack event idempotent rather than double-counted.
 */
export const PaystackWebhookEventTable = pgTable(
  "paystack_webhook_event",
  {
    ...Schema.id(),

    eventId: text().notNull().unique(),
    eventType: text().notNull(),
    reference: text(),
    payload: text().notNull(),
    status: text().notNull(),
    processedAt: timestamp({ mode: "date" }),

    ...Schema.timestamps,
  },
  (table) => [index("paystack_webhook_event_type_idx").on(table.eventType)],
);

export type PaystackWebhookEvent =
  typeof PaystackWebhookEventTable.$inferSelect;
