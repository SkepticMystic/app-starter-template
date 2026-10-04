DROP INDEX "paystack_transaction_reference_idx";--> statement-breakpoint
DROP INDEX "idx_task_org_id";--> statement-breakpoint
CREATE INDEX "account_provider_id_account_id_idx" ON "account" ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "invitation_inviter_id_idx" ON "invitation" ("inviter_id");--> statement-breakpoint
CREATE INDEX "paystack_transaction_reference_id_idx" ON "paystack_transaction" ("reference_id");--> statement-breakpoint
CREATE INDEX "paystack_transaction_user_id_idx" ON "paystack_transaction" ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_reference_id_status_idx" ON "subscription" ("reference_id","status");--> statement-breakpoint
CREATE INDEX "subscription_transaction_reference_idx" ON "subscription" ("paystack_transaction_reference");--> statement-breakpoint
CREATE INDEX "subscription_user_id_idx" ON "subscription" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_task_org_id_created_at" ON "task" ("org_id","created_at");