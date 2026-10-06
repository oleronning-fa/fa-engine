CREATE TABLE "roadmap_milestone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roadmap_item_id" uuid NOT NULL,
	"key" text NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "roadmap_milestone" ADD CONSTRAINT "roadmap_milestone_roadmap_item_id_roadmap_item_id_fk" FOREIGN KEY ("roadmap_item_id") REFERENCES "public"."roadmap_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "roadmap_milestone_item_key_idx" ON "roadmap_milestone" USING btree ("roadmap_item_id","key");