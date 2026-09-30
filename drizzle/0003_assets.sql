CREATE TABLE "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"studio_id" text NOT NULL,
	"content_type" text NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "assets_studio_idx" ON "assets" USING btree ("studio_id");