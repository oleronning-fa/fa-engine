CREATE TABLE "roadmap_attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roadmap_item_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_path" text NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "roadmap_item" ADD COLUMN "color_label" text;--> statement-breakpoint
ALTER TABLE "roadmap_item" ADD COLUMN "sort_order" double precision;--> statement-breakpoint
ALTER TABLE "roadmap_attachment" ADD CONSTRAINT "roadmap_attachment_roadmap_item_id_roadmap_item_id_fk" FOREIGN KEY ("roadmap_item_id") REFERENCES "public"."roadmap_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_attachment" ADD CONSTRAINT "roadmap_attachment_uploaded_by_app_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "roadmap_attachment_item_idx" ON "roadmap_attachment" USING btree ("roadmap_item_id");