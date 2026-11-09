import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const articleCategoryEnum = ["compare", "use-cases", "blog"] as const;

export const articleStatusEnum = ["draft", "published"] as const;

export const articleLocaleEnum = ["en", "zh"] as const;

export const sponsorTierEnum = ["gold", "regular"] as const;

/**
 * Publication state of a sponsor row. Admin-created rows default to "published"
 * and show on the wall immediately; self-service submissions (via an invite
 * link) start as "pending" and only appear once an admin approves them.
 */
export const sponsorStatusEnum = ["pending", "published"] as const;

export const articles = sqliteTable(
  "articles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    slug: text("slug").notNull(),
    category: text("category", { enum: articleCategoryEnum }).notNull(),
    datePublished: text("date_published").notNull(),
    status: text("status", { enum: articleStatusEnum })
      .notNull()
      .default("draft"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("articles_category_slug_idx").on(table.category, table.slug),
    index("articles_status_idx").on(table.status),
    check(
      "articles_category_check",
      sql`${table.category} in ('compare', 'use-cases', 'blog')`,
    ),
    check(
      "articles_status_check",
      sql`${table.status} in ('draft', 'published')`,
    ),
  ],
);

export const articleTranslations = sqliteTable(
  "article_translations",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    locale: text("locale", { enum: articleLocaleEnum }).notNull(),
    payload: text("payload", { mode: "json" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.locale] }),
    index("article_translations_article_id_idx").on(table.articleId),
    check(
      "article_translations_locale_check",
      sql`${table.locale} in ('en', 'zh')`,
    ),
    check(
      "article_translations_payload_check",
      sql`json_valid(${table.payload})`,
    ),
  ],
);

export const apiTokens = sqliteTable(
  "api_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    tokenHash: text("token_hash").notNull(),
    label: text("label").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  },
  (table) => [uniqueIndex("api_tokens_token_hash_idx").on(table.tokenHash)],
);

export const releases = sqliteTable(
  "releases",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    version: text("version").notNull(),
    pubDate: integer("pub_date", { mode: "timestamp_ms" }).notNull(),
    notesEn: text("notes_en").notNull(),
    notesZh: text("notes_zh").notNull(),
    platforms: text("platforms", { mode: "json" }).notNull(),
    rawPayload: text("raw_payload", { mode: "json" }).notNull(),
    manualOverride: integer("manual_override", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("releases_version_idx").on(table.version),
    index("releases_pub_date_idx").on(table.pubDate),
    check("releases_platforms_check", sql`json_valid(${table.platforms})`),
    check("releases_raw_payload_check", sql`json_valid(${table.rawPayload})`),
    check(
      "releases_manual_override_check",
      sql`${table.manualOverride} in (0, 1)`,
    ),
  ],
);

export const founders = sqliteTable(
  "founders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: text("name").notNull(),
    platform: text("platform").notNull(),
    joinedAt: text("joined_at").notNull(),
    note: text("note"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("founders_display_order_idx").on(table.displayOrder)],
);

export const iosBetaSignups = sqliteTable(
  "ios_beta_signups",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    email: text("email").notNull(),
    locale: text("locale"),
    userAgent: text("user_agent"),
    note: text("note"),
    invitedAt: integer("invited_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("ios_beta_signups_email_idx").on(table.email),
    index("ios_beta_signups_created_at_idx").on(table.createdAt),
  ],
);

export const sponsors = sqliteTable(
  "sponsors",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: text("name").notNull(),
    /** Optional homepage / profile link shown on the wall. */
    url: text("url"),
    tier: text("tier", { enum: sponsorTierEnum }).notNull().default("regular"),
    /**
     * Publication state. Admin-created rows are "published"; self-service
     * submissions via an invite link start "pending" until an admin approves.
     */
    status: text("status", { enum: sponsorStatusEnum })
      .notNull()
      .default("published"),
    /** Month they started sponsoring, e.g. "2026-01". */
    since: text("since"),
    /** One-line public shout-out shown under the name. */
    note: text("note"),
    /** Sponsorship amount in cents (CNY). Admin-only; never shown publicly. */
    amountCents: integer("amount_cents"),
    /** GitHub username, when the entry was created via GitHub lookup. */
    githubLogin: text("github_login"),
    /** External avatar URL (GitHub CDN or pasted). Used when no upload exists. */
    avatarUrl: text("avatar_url"),
    /** Uploaded avatar, downscaled to a small webp and stored as base64. */
    avatarData: text("avatar_data"),
    /** Content-type for the uploaded avatar, e.g. "image/webp". */
    avatarMime: text("avatar_mime"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("sponsors_display_order_idx").on(table.displayOrder),
    index("sponsors_status_idx").on(table.status),
    check("sponsors_tier_check", sql`${table.tier} in ('gold', 'regular')`),
    check(
      "sponsors_status_check",
      sql`${table.status} in ('pending', 'published')`,
    ),
    // Monetary integrity: amount is either unset (NULL) or non-negative.
    check("sponsors_amount_cents_non_negative", sql`${table.amountCents} >= 0`),
  ],
);

/**
 * Single-use invite links the admin generates and sends to a sponsor so they
 * can fill in their own public profile (name, avatar, note, link). The raw
 * token is never stored — only its SHA-256 hash, mirroring `api_tokens`. The
 * admin pre-sets `tier` and `amountCents` when minting the link; the sponsor
 * never sees or edits those. A link is consumed (`usedAt`) the moment a sponsor
 * submits, which creates a "pending" sponsor row referenced by `sponsorId`.
 */
export const sponsorInvites = sqliteTable(
  "sponsor_invites",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    /** SHA-256 hash of the raw token; the raw token is shown to the admin once. */
    tokenHash: text("token_hash").notNull(),
    /** Admin-only memo, e.g. who the link was sent to. */
    label: text("label"),
    /** Tier the resulting sponsor row inherits. */
    tier: text("tier", { enum: sponsorTierEnum }).notNull().default("regular"),
    /** Sponsorship amount in cents (CNY) the resulting row inherits. Admin-only. */
    amountCents: integer("amount_cents"),
    /** When the link stops being valid. NULL means it never expires. */
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    /** When the link was consumed. NULL means still usable. */
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    /** The sponsor row created when the link was consumed. */
    sponsorId: text("sponsor_id").references(() => sponsors.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("sponsor_invites_token_hash_idx").on(table.tokenHash),
    index("sponsor_invites_created_at_idx").on(table.createdAt),
    check(
      "sponsor_invites_tier_check",
      sql`${table.tier} in ('gold', 'regular')`,
    ),
    check(
      "sponsor_invites_amount_cents_non_negative",
      sql`${table.amountCents} >= 0`,
    ),
  ],
);

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type ArticleTranslation = typeof articleTranslations.$inferSelect;
export type NewArticleTranslation = typeof articleTranslations.$inferInsert;
export type ApiToken = typeof apiTokens.$inferSelect;
export type NewApiToken = typeof apiTokens.$inferInsert;
export type Founder = typeof founders.$inferSelect;
export type NewFounder = typeof founders.$inferInsert;
export type Release = typeof releases.$inferSelect;
export type NewRelease = typeof releases.$inferInsert;
export type IosBetaSignup = typeof iosBetaSignups.$inferSelect;
export type NewIosBetaSignup = typeof iosBetaSignups.$inferInsert;
export type Sponsor = typeof sponsors.$inferSelect;
export type NewSponsor = typeof sponsors.$inferInsert;
export type SponsorInvite = typeof sponsorInvites.$inferSelect;
export type NewSponsorInvite = typeof sponsorInvites.$inferInsert;
