ALTER TABLE "image" DROP CONSTRAINT "image_member_id_member_id_fkey";--> statement-breakpoint
ALTER TABLE "task" DROP CONSTRAINT "task_member_id_member_id_fk";--> statement-breakpoint
ALTER TABLE "task" DROP CONSTRAINT "task_assigned_member_id_member_id_fk";--> statement-breakpoint
CREATE UNIQUE INDEX "member_id_organization_id_uidx" ON "member" ("id","organization_id");--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_member_org_fkey" FOREIGN KEY ("member_id","org_id") REFERENCES "member"("id","organization_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_member_org_fkey" FOREIGN KEY ("member_id","org_id") REFERENCES "member"("id","organization_id") ON DELETE CASCADE;--> statement-breakpoint
-- HAND-EDITED: drizzle emits a bare SET NULL, which would null "org_id" too and,
-- that being NOT NULL, fail every member removal and org deletion. The column
-- list (Postgres 15+) nulls the assignee alone. See task.model.ts.
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_org_fkey" FOREIGN KEY ("assigned_member_id","org_id") REFERENCES "member"("id","organization_id") ON DELETE SET NULL ("assigned_member_id");