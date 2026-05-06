CREATE TABLE "releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text NOT NULL,
	"pub_date" timestamp with time zone NOT NULL,
	"notes_en" text NOT NULL,
	"notes_zh" text NOT NULL,
	"platforms" jsonb NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "releases_version_idx" ON "releases" USING btree ("version");--> statement-breakpoint
CREATE INDEX "releases_pub_date_idx" ON "releases" USING btree ("pub_date");