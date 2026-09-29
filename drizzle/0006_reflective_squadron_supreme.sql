ALTER TABLE "app_user" ADD COLUMN "jira_account_id" text;--> statement-breakpoint
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_jira_account_id_unique" UNIQUE("jira_account_id");