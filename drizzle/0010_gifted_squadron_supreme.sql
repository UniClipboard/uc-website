CREATE TYPE "public"."sponsor_status" AS ENUM('pending', 'published');--> statement-breakpoint
CREATE TABLE "sponsor_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"label" text,
	"tier" "sponsor_tier" DEFAULT 'regular' NOT NULL,
	"amount_cents" integer,
	"expires_at" timestamp with time zone,
	"used_at" timestamp with time zone,
	"sponsor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sponsor_invites_amount_cents_non_negative" CHECK ("sponsor_invites"."amount_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "sponsors" ADD COLUMN "status" "sponsor_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "sponsor_invites" ADD CONSTRAINT "sponsor_invites_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sponsor_invites_token_hash_idx" ON "sponsor_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sponsor_invites_created_at_idx" ON "sponsor_invites" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sponsors_status_idx" ON "sponsors" USING btree ("status");