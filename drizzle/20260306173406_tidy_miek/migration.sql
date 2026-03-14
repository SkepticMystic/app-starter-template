CREATE TYPE "image_providers" AS ENUM('cloudinary');--> statement-breakpoint
CREATE TYPE "image_resource_kind" AS ENUM('user', 'organization');--> statement-breakpoint
CREATE TABLE "apiKey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"config_id" text NOT NULL,
	"name" text,
	"start" text,
	"prefix" text,
	"key" text NOT NULL,
	"reference_id" text NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp(6) with time zone,
	"enabled" boolean NOT NULL,
	"rate_limit_enabled" boolean NOT NULL,
	"rate_limit_time_window" integer,
	"rate_limit_max" integer,
	"request_count" integer NOT NULL,
	"remaining" integer,
	"last_request" timestamp(6) with time zone,
	"expires_at" timestamp(6) with time zone,
	"created_at" timestamp(6) with time zone NOT NULL,
	"updated_at" timestamp(6) with time zone NOT NULL,
	"permissions" text,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"resource_id" uuid NOT NULL,
	"resource_kind" "image_resource_kind" NOT NULL,
	"url" varchar(2048) NOT NULL,
	"provider" "image_providers" NOT NULL,
	"external_id" varchar(255) NOT NULL UNIQUE,
	"size" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"thumbhash" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_image_user_id" ON "image" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_image_org_id" ON "image" ("org_id");--> statement-breakpoint
CREATE INDEX "idx_image_member_id" ON "image" ("member_id");--> statement-breakpoint
CREATE INDEX "idx_image_resource_id" ON "image" ("resource_id");--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_member_id_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE;