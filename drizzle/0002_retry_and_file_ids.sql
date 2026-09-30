ALTER TABLE "analyses" ADD COLUMN "file_ids" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "analysis_tasks" ADD COLUMN "attempts" integer DEFAULT 1 NOT NULL;