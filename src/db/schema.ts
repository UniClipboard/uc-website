import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const articleCategoryEnum = pgEnum("article_category", [
  "compare",
  "use-cases",
  "blog",
]);

export const articleStatusEnum = pgEnum("article_status", [
  "draft",
  "published",
]);

export const articleLocaleEnum = pgEnum("article_locale", ["en", "zh"]);

export const sponsorTierEnum = pgEnum("sponsor_tier", ["gold", "regular"]);

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    category: articleCategoryEnum("category").notNull(),
    datePublished: text("date_published").notNull(),
    status: articleStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("articles_category_slug_idx").on(table.category, table.slug),
    index("articles_status_idx").on(table.status),
  ],
);

export const articleTranslations = pgTable(
  "article_translations",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    locale: articleLocaleEnum("locale").notNull(),
    payload: jsonb("payload").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.locale] }),
    index("article_translations_article_id_idx").on(table.articleId),
  ],
);

export const apiTokens = pgTable(
  "api_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("api_tokens_token_hash_idx").on(table.tokenHash)],
);

export const releases = pgTable(
  "releases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    version: text("version").notNull(),
    pubDate: timestamp("pub_date", { withTimezone: true }).notNull(),
    notesEn: text("notes_en").notNull(),
    notesZh: text("notes_zh").notNull(),
    platforms: jsonb("platforms").notNull(),
    rawPayload: jsonb("raw_payload").notNull(),
    manualOverride: boolean("manual_override").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("releases_version_idx").on(table.version),
    index("releases_pub_date_idx").on(table.pubDate),
  ],
);

export const founders = pgTable(
  "founders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    platform: text("platform").notNull(),
    joinedAt: text("joined_at").notNull(),
    note: text("note"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("founders_display_order_idx").on(table.displayOrder)],
);

export const iosBetaSignups = pgTable(
  "ios_beta_signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    locale: text("locale"),
    userAgent: text("user_agent"),
    note: text("note"),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("ios_beta_signups_email_idx").on(table.email),
    index("ios_beta_signups_created_at_idx").on(table.createdAt),
  ],
);

export const sponsors = pgTable(
  "sponsors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** Optional homepage / profile link shown on the wall. */
    url: text("url"),
    tier: sponsorTierEnum("tier").notNull().default("regular"),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sponsors_display_order_idx").on(table.displayOrder),
    // Monetary integrity: amount is either unset (NULL) or non-negative.
    check("sponsors_amount_cents_non_negative", sql`${table.amountCents} >= 0`),
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

export const updateUpdatedAt = sql`now()`;
