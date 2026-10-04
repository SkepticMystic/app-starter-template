CREATE TABLE "audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"type" varchar(64) NOT NULL,
	"user_id" uuid,
	"actor_user_id" uuid,
	"org_id" uuid,
	"ip" varchar(64),
	"user_agent" varchar(512),
	"device" varchar(128),
	"country" varchar(2),
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_audit_event_user_id_created_at" ON "audit_event" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_event_org_id_created_at" ON "audit_event" ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_event_actor_user_id" ON "audit_event" ("actor_user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_event_created_at" ON "audit_event" ("created_at");--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_org_id_organization_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE CASCADE;