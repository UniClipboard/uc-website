CREATE TYPE "public"."sponsor_tier" AS ENUM('gold', 'regular');--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"tier" "sponsor_tier" DEFAULT 'regular' NOT NULL,
	"since" text,
	"note" text,
	"github_login" text,
	"avatar_url" text,
	"avatar_data" text,
	"avatar_mime" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "sponsors_display_order_idx" ON "sponsors" USING btree ("display_order");