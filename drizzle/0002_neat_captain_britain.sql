ALTER TABLE "invitation" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."invitation_status";--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'canceled', 'rejected');--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."invitation_status";--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "status" SET DATA TYPE "public"."invitation_status" USING "status"::"public"."invitation_status";