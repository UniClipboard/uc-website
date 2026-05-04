import { sql } from "drizzle-orm";
import {
  index,
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

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type ArticleTranslation = typeof articleTranslations.$inferSelect;
export type NewArticleTranslation = typeof articleTranslations.$inferInsert;

export const updateUpdatedAt = sql`now()`;
