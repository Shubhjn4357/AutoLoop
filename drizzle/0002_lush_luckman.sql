CREATE TABLE "connected_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_account_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"name" text,
	"picture" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_automations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"connected_account_id" text,
	"name" text NOT NULL,
	"trigger_type" varchar(50) NOT NULL,
	"keywords" jsonb,
	"action_type" varchar(50) NOT NULL,
	"response_template" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"connected_account_id" text,
	"content" text,
	"media_urls" jsonb,
	"scheduled_at" timestamp,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"platform" varchar(20) NOT NULL,
	"published_at" timestamp,
	"platform_post_id" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"wamid" text,
	"phone_number" text NOT NULL,
	"direction" varchar(10) NOT NULL,
	"type" varchar(20) DEFAULT 'text',
	"status" varchar(20) DEFAULT 'sent',
	"body" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_messages_wamid_unique" UNIQUE("wamid")
);
--> statement-breakpoint
ALTER TABLE "automation_workflows" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "automation_workflows" ADD COLUMN "last_run_at" timestamp;--> statement-breakpoint
ALTER TABLE "automation_workflows" ADD COLUMN "execution_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "automation_workflows" ADD COLUMN "timezone" varchar(50) DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "linkedin_session_cookie" text;--> statement-breakpoint
ALTER TABLE "workflow_execution_logs" ADD COLUMN "state" jsonb;--> statement-breakpoint
ALTER TABLE "workflow_execution_logs" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_automations" ADD CONSTRAINT "social_automations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_automations" ADD CONSTRAINT "social_automations_connected_account_id_connected_accounts_id_fk" FOREIGN KEY ("connected_account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_connected_account_id_connected_accounts_id_fk" FOREIGN KEY ("connected_account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflow_user_id_idx" ON "automation_workflows" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workflow_is_active_idx" ON "automation_workflows" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "exec_workflow_id_idx" ON "workflow_execution_logs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "exec_started_at_idx" ON "workflow_execution_logs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "exec_trigger_id_idx" ON "workflow_trigger_executions" USING btree ("trigger_id");--> statement-breakpoint
CREATE INDEX "trigger_exec_workflow_id_idx" ON "workflow_trigger_executions" USING btree ("workflow_id");