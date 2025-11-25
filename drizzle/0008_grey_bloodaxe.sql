ALTER TABLE "session" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "session" CASCADE;--> statement-breakpoint
DROP INDEX "account_user_id_idx";--> statement-breakpoint
DROP INDEX "invitation_org_id_idx";--> statement-breakpoint
DROP INDEX "member_user_idx";--> statement-breakpoint
DROP INDEX "member_org_idx";--> statement-breakpoint
DROP INDEX "org_slug_idx";--> statement-breakpoint
DROP INDEX "user_email_idx";--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");