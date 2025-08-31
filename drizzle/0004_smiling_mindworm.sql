ALTER TABLE "session" RENAME COLUMN "org_id" TO "active_organization_id";--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_org_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_active_organization_id_organization_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;