ALTER TABLE "roadmap_item" ADD COLUMN "jira_assignee_name" text;--> statement-breakpoint
ALTER TABLE "roadmap_item" ADD COLUMN "jira_estimate_seconds" integer;--> statement-breakpoint
ALTER TABLE "roadmap_item" ADD COLUMN "jira_spent_seconds" integer;