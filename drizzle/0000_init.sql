CREATE TABLE "analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"studio_id" text NOT NULL,
	"source" text NOT NULL,
	"status" text NOT NULL,
	"image_hashes" jsonb NOT NULL,
	"measurements" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"demo_client_id" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"analysis_id" text NOT NULL,
	"feature" text NOT NULL,
	"youcam_task_id" text,
	"status" text NOT NULL,
	"raw" jsonb,
	"error_code" text,
	"units" integer DEFAULT 0 NOT NULL,
	"cached" boolean DEFAULT false NOT NULL,
	"upstream_deleted" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"studio_id" text,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"studio_id" text NOT NULL,
	"service_id" text NOT NULL,
	"analysis_id" text,
	"client_name" text DEFAULT '' NOT NULL,
	"options" jsonb NOT NULL,
	"measurements" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"source" text NOT NULL,
	"receipt_hash" text NOT NULL,
	"status" text DEFAULT 'quoted' NOT NULL,
	"start_at" timestamp with time zone,
	"actual_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "result_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"raw" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studios" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"hourly_rate" integer NOT NULL,
	"deposit_pct" real DEFAULT 0.25 NOT NULL,
	"price_by_time" boolean DEFAULT true NOT NULL,
	"services" jsonb NOT NULL,
	"admin_token_hash" text NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "studios_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "usage_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"feature" text NOT NULL,
	"units" integer NOT NULL,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "analysis_tasks_analysis_idx" ON "analysis_tasks" USING btree ("analysis_id");