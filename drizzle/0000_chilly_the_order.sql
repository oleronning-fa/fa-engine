-- pgvector: required by signal.embedding / theme.embedding. Needs the extension
-- available in the Postgres installation. On the platform's shared Postgres this
-- is an open item — see docs/fa-engine-phase-0-plan.md.
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"initials" text,
	"role" text DEFAULT 'produkt' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_email_unique" UNIQUE("email"),
	CONSTRAINT "app_user_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_number" text,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_org_number_unique" UNIQUE("org_number")
);
--> statement-breakpoint
CREATE TABLE "person" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pseudonym_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone_e164" text,
	"phone_raw" text,
	"account_id" uuid,
	"origin" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "person_pseudonym_id_unique" UNIQUE("pseudonym_id")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"external_id" text,
	"product_name" text,
	"status" text,
	"price_nok" integer,
	"cancellation_reason" text,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"raw_text" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"person_id" uuid,
	"account_id" uuid,
	"area" text,
	"objection" text,
	"sentiment" text,
	"embedding" vector(1536),
	"dedupe_key" text,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "theme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"signal_count" bigint DEFAULT 0 NOT NULL,
	"first_seen_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"affected_arr_nok" bigint,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmap_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roadmap_item_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmap_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"discipline" text,
	"title" text NOT NULL,
	"raw_title" text,
	"description" text,
	"area" text,
	"owner_id" uuid,
	"coordinator_id" uuid,
	"status" text NOT NULL,
	"jira_substatus" text,
	"declined_reason" text,
	"jira_key" text,
	"backlogged" boolean DEFAULT false NOT NULL,
	"priority" text,
	"size" text,
	"target_date" date,
	"target_week" text,
	"completed_at" timestamp with time zone,
	"parent_id" uuid,
	"proposed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmap_item_assignee" (
	"roadmap_item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "roadmap_item_assignee_roadmap_item_id_user_id_pk" PRIMARY KEY("roadmap_item_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "roadmap_item_theme" (
	"roadmap_item_id" uuid NOT NULL,
	"theme_id" uuid NOT NULL,
	CONSTRAINT "roadmap_item_theme_roadmap_item_id_theme_id_pk" PRIMARY KEY("roadmap_item_id","theme_id")
);
--> statement-breakpoint
CREATE TABLE "roadmap_source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roadmap_item_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"ref" text NOT NULL,
	"label" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "roadmap_status_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"roadmap_item_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text,
	"from_substatus" text,
	"to_substatus" text,
	"actor_id" uuid,
	"note" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"evidence_signal_ids" jsonb,
	"confidence" real,
	"status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"roadmap_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" uuid
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"actor_kind" text DEFAULT 'user' NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"payload" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_call" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"purpose" text,
	"prompt_hash" text,
	"model" text,
	"input_tokens" real,
	"output_tokens" real,
	"cost_nok" real,
	"latency_ms" real,
	"pii_class" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "area_routing" (
	"area_id" text PRIMARY KEY NOT NULL,
	"responsible_user_id" uuid,
	"slack_channel_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" text NOT NULL,
	"source_ref" text,
	"raw" jsonb,
	"issue" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person_alias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alias" text NOT NULL,
	"canonical_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "person_alias_alias_unique" UNIQUE("alias")
);
--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_created_by_app_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_comment" ADD CONSTRAINT "roadmap_comment_roadmap_item_id_roadmap_item_id_fk" FOREIGN KEY ("roadmap_item_id") REFERENCES "public"."roadmap_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_comment" ADD CONSTRAINT "roadmap_comment_author_id_app_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_item" ADD CONSTRAINT "roadmap_item_owner_id_app_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_item" ADD CONSTRAINT "roadmap_item_coordinator_id_app_user_id_fk" FOREIGN KEY ("coordinator_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_item" ADD CONSTRAINT "roadmap_item_parent_id_roadmap_item_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."roadmap_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_item" ADD CONSTRAINT "roadmap_item_proposed_by_app_user_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_item" ADD CONSTRAINT "roadmap_item_created_by_app_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_item_assignee" ADD CONSTRAINT "roadmap_item_assignee_roadmap_item_id_roadmap_item_id_fk" FOREIGN KEY ("roadmap_item_id") REFERENCES "public"."roadmap_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_item_assignee" ADD CONSTRAINT "roadmap_item_assignee_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_item_theme" ADD CONSTRAINT "roadmap_item_theme_roadmap_item_id_roadmap_item_id_fk" FOREIGN KEY ("roadmap_item_id") REFERENCES "public"."roadmap_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_item_theme" ADD CONSTRAINT "roadmap_item_theme_theme_id_theme_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."theme"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_source" ADD CONSTRAINT "roadmap_source_roadmap_item_id_roadmap_item_id_fk" FOREIGN KEY ("roadmap_item_id") REFERENCES "public"."roadmap_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_source" ADD CONSTRAINT "roadmap_source_created_by_app_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_status_log" ADD CONSTRAINT "roadmap_status_log_roadmap_item_id_roadmap_item_id_fk" FOREIGN KEY ("roadmap_item_id") REFERENCES "public"."roadmap_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_status_log" ADD CONSTRAINT "roadmap_status_log_actor_id_app_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_roadmap_item_id_roadmap_item_id_fk" FOREIGN KEY ("roadmap_item_id") REFERENCES "public"."roadmap_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_decided_by_app_user_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_actor_id_app_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area_routing" ADD CONSTRAINT "area_routing_responsible_user_id_app_user_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_note" ADD CONSTRAINT "import_note_resolved_by_app_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_alias" ADD CONSTRAINT "person_alias_canonical_user_id_app_user_id_fk" FOREIGN KEY ("canonical_user_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "roadmap_comment_item_idx" ON "roadmap_comment" USING btree ("roadmap_item_id");--> statement-breakpoint
CREATE INDEX "roadmap_item_type_idx" ON "roadmap_item" USING btree ("type");--> statement-breakpoint
CREATE INDEX "roadmap_item_status_idx" ON "roadmap_item" USING btree ("status");--> statement-breakpoint
CREATE INDEX "roadmap_item_area_idx" ON "roadmap_item" USING btree ("area");--> statement-breakpoint
CREATE INDEX "roadmap_item_jira_key_idx" ON "roadmap_item" USING btree ("jira_key");--> statement-breakpoint
CREATE INDEX "roadmap_item_parent_idx" ON "roadmap_item" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "roadmap_source_item_idx" ON "roadmap_source" USING btree ("roadmap_item_id");--> statement-breakpoint
CREATE INDEX "roadmap_status_log_item_idx" ON "roadmap_status_log" USING btree ("roadmap_item_id");--> statement-breakpoint
CREATE INDEX "event_entity_idx" ON "event" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "event_at_idx" ON "event" USING btree ("at");--> statement-breakpoint
CREATE INDEX "llm_call_at_idx" ON "llm_call" USING btree ("at");--> statement-breakpoint
CREATE INDEX "import_note_run_idx" ON "import_note" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "import_note_resolved_idx" ON "import_note" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "person_alias_alias_idx" ON "person_alias" USING btree ("alias");