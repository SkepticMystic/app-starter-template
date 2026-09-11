ALTER TYPE "paystack_transaction_status" ADD VALUE 'ongoing';--> statement-breakpoint
ALTER TYPE "paystack_transaction_status" ADD VALUE 'processing';--> statement-breakpoint
ALTER TYPE "paystack_transaction_status" ADD VALUE 'queued';--> statement-breakpoint
ALTER TYPE "paystack_transaction_status" ADD VALUE 'reversed';--> statement-breakpoint
CREATE TABLE "paystack_customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reference_type" text NOT NULL,
	"reference_id" uuid NOT NULL,
	"reference_key" text NOT NULL UNIQUE,
	"customer_code" text NOT NULL UNIQUE,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paystack_payment_credential" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"subscription_id" uuid NOT NULL UNIQUE,
	"authorization_code_encrypted" text,
	"email_token_encrypted" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paystack_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"interval" text NOT NULL,
	"group" text,
	"plan_code" text NOT NULL UNIQUE,
	"paystack_id" text NOT NULL UNIQUE,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paystack_product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"currency" text NOT NULL,
	"quantity" integer,
	"unlimited" boolean,
	"paystack_id" text UNIQUE,
	"slug" text NOT NULL UNIQUE,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paystack_webhook_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" text NOT NULL UNIQUE,
	"event_type" text NOT NULL,
	"reference" text,
	"payload" text NOT NULL,
	"status" text NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "two_factor" ADD COLUMN "verified" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "two_factor" ADD COLUMN "failed_verification_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "two_factor" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "paystack_transaction" ADD COLUMN "product" varchar(255);--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "plan_code" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "pending_plan" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "billing_interval" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "cancel_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "canceled_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "ended_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "paystack_transaction" ADD CONSTRAINT "paystack_transaction_reference_key" UNIQUE("reference");--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_paystack_subscription_code_key" UNIQUE("paystack_subscription_code");--> statement-breakpoint
CREATE INDEX "api_key_key_idx" ON "apiKey" ("key");--> statement-breakpoint
CREATE INDEX "api_key_reference_id_idx" ON "apiKey" ("reference_id");--> statement-breakpoint
CREATE INDEX "api_key_config_id_idx" ON "apiKey" ("config_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_user_id_organization_id_uidx" ON "member" ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "paystack_customer_reference_id_idx" ON "paystack_customer" ("reference_id");--> statement-breakpoint
CREATE INDEX "paystack_webhook_event_type_idx" ON "paystack_webhook_event" ("event_type");--> statement-breakpoint
ALTER TABLE "paystack_payment_credential" ADD CONSTRAINT "paystack_payment_credential_vaPWu6bJ6RQt_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;