CREATE TABLE "shops" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"platform" text NOT NULL,
	"domain" text NOT NULL,
	"product_url" text NOT NULL,
	"product" jsonb NOT NULL,
	"settings" jsonb NOT NULL,
	"admin_token_hash" text NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shops_slug_unique" UNIQUE("slug")
);
