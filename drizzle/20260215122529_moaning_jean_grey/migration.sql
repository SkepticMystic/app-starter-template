CREATE TYPE "paystack_transaction_status" AS ENUM('success', 'pending', 'failed', 'abandoned');--> statement-breakpoint
CREATE TYPE "subscription_status" AS ENUM('active', 'trialing', 'canceled', 'incomplete');--> statement-breakpoint
CREATE TABLE "paystack_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"paystack_id" text,
	"reference" text NOT NULL,
	"reference_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer,
	"currency" text NOT NULL,
	"status" "paystack_transaction_status" NOT NULL,
	"plan" varchar(255),
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"group_id" text,
	"seats" integer,
	"plan" varchar(255) NOT NULL,
	"status" "subscription_status" DEFAULT 'incomplete'::"subscription_status" NOT NULL,
	"reference_id" uuid NOT NULL,
	"paystack_customer_code" text,
	"paystack_subscription_code" text,
	"paystack_transaction_reference" text,
	"period_start" timestamp,
	"period_end" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false
);
--> statement-breakpoint
CREATE INDEX "paystack_transaction_reference_idx" ON "paystack_transaction" ("reference");--> statement-breakpoint
ALTER TABLE "paystack_transaction" ADD CONSTRAINT "paystack_transaction_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;