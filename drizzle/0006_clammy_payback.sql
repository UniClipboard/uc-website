CREATE TABLE "ios_beta_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"locale" text,
	"user_agent" text,
	"note" text,
	"invited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ios_beta_signups_email_idx" ON "ios_beta_signups" USING btree ("email");--> statement-breakpoint
CREATE INDEX "ios_beta_signups_created_at_idx" ON "ios_beta_signups" USING btree ("created_at");