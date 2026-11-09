CREATE TABLE `api_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`label` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_used_at` integer,
	`revoked_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_tokens_token_hash_idx` ON `api_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `article_translations` (
	`article_id` text NOT NULL,
	`locale` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`article_id`, `locale`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "article_translations_locale_check" CHECK("article_translations"."locale" in ('en', 'zh')),
	CONSTRAINT "article_translations_payload_check" CHECK(json_valid("article_translations"."payload"))
);
--> statement-breakpoint
CREATE INDEX `article_translations_article_id_idx` ON `article_translations` (`article_id`);--> statement-breakpoint
CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`category` text NOT NULL,
	`date_published` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "articles_category_check" CHECK("articles"."category" in ('compare', 'use-cases', 'blog')),
	CONSTRAINT "articles_status_check" CHECK("articles"."status" in ('draft', 'published'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_category_slug_idx` ON `articles` (`category`,`slug`);--> statement-breakpoint
CREATE INDEX `articles_status_idx` ON `articles` (`status`);--> statement-breakpoint
CREATE TABLE `founders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`platform` text NOT NULL,
	`joined_at` text NOT NULL,
	`note` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `founders_display_order_idx` ON `founders` (`display_order`);--> statement-breakpoint
CREATE TABLE `ios_beta_signups` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`locale` text,
	`user_agent` text,
	`note` text,
	`invited_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ios_beta_signups_email_idx` ON `ios_beta_signups` (`email`);--> statement-breakpoint
CREATE INDEX `ios_beta_signups_created_at_idx` ON `ios_beta_signups` (`created_at`);--> statement-breakpoint
CREATE TABLE `releases` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`pub_date` integer NOT NULL,
	`notes_en` text NOT NULL,
	`notes_zh` text NOT NULL,
	`platforms` text NOT NULL,
	`raw_payload` text NOT NULL,
	`manual_override` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "releases_platforms_check" CHECK(json_valid("releases"."platforms")),
	CONSTRAINT "releases_raw_payload_check" CHECK(json_valid("releases"."raw_payload")),
	CONSTRAINT "releases_manual_override_check" CHECK("releases"."manual_override" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `releases_version_idx` ON `releases` (`version`);--> statement-breakpoint
CREATE INDEX `releases_pub_date_idx` ON `releases` (`pub_date`);--> statement-breakpoint
CREATE TABLE `sponsor_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`label` text,
	`tier` text DEFAULT 'regular' NOT NULL,
	`amount_cents` integer,
	`expires_at` integer,
	`used_at` integer,
	`sponsor_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`sponsor_id`) REFERENCES `sponsors`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "sponsor_invites_tier_check" CHECK("sponsor_invites"."tier" in ('gold', 'regular')),
	CONSTRAINT "sponsor_invites_amount_cents_non_negative" CHECK("sponsor_invites"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sponsor_invites_token_hash_idx` ON `sponsor_invites` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sponsor_invites_created_at_idx` ON `sponsor_invites` (`created_at`);--> statement-breakpoint
CREATE TABLE `sponsors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text,
	`tier` text DEFAULT 'regular' NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`since` text,
	`note` text,
	`amount_cents` integer,
	`github_login` text,
	`avatar_url` text,
	`avatar_data` text,
	`avatar_mime` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "sponsors_tier_check" CHECK("sponsors"."tier" in ('gold', 'regular')),
	CONSTRAINT "sponsors_status_check" CHECK("sponsors"."status" in ('pending', 'published')),
	CONSTRAINT "sponsors_amount_cents_non_negative" CHECK("sponsors"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `sponsors_display_order_idx` ON `sponsors` (`display_order`);--> statement-breakpoint
CREATE INDEX `sponsors_status_idx` ON `sponsors` (`status`);