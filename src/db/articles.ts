import { and, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import {
  type ArticleCategoryValue,
  type ArticleContent,
  articleContentSchema,
  type ArticleLocale,
  type ArticleStatusValue,
} from "@/lib/article-content";

import { db } from "./client";
import { articles, articleTranslations } from "./schema";

export type ArticleRecord = {
  id: string;
  slug: string;
  category: ArticleCategoryValue;
  datePublished: string;
  status: ArticleStatusValue;
  createdAt: Date;
  updatedAt: Date;
};

export type ArticleWithTranslation = ArticleRecord & {
  content: ArticleContent;
  locale: ArticleLocale;
};

export type ArticleWithAllTranslations = ArticleRecord & {
  translations: Partial<Record<ArticleLocale, ArticleContent>>;
};

export const articleCacheTag = (category: ArticleCategoryValue, slug: string) =>
  `article:${category}:${slug}`;

export const hubCacheTag = (category: ArticleCategoryValue) =>
  `articles:hub:${category}`;

export const allArticlesCacheTag = "articles:all";

const parseContent = (raw: unknown): ArticleContent =>
  articleContentSchema.parse(raw);

async function fetchArticleBySlugRaw(
  category: ArticleCategoryValue,
  slug: string,
  locale: ArticleLocale,
): Promise<ArticleWithTranslation | null> {
  const rows = await db
    .select({
      article: articles,
      translation: articleTranslations,
    })
    .from(articles)
    .innerJoin(
      articleTranslations,
      and(
        eq(articleTranslations.articleId, articles.id),
        eq(articleTranslations.locale, locale),
      ),
    )
    .where(
      and(
        eq(articles.category, category),
        eq(articles.slug, slug),
        eq(articles.status, "published"),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.article.id,
    slug: row.article.slug,
    category: row.article.category as ArticleCategoryValue,
    datePublished: row.article.datePublished,
    status: row.article.status as ArticleStatusValue,
    createdAt: row.article.createdAt,
    updatedAt: row.article.updatedAt,
    locale,
    content: parseContent(row.translation.payload),
  };
}

async function fetchPublishedByCategoryRaw(
  category: ArticleCategoryValue,
  locale: ArticleLocale,
): Promise<ArticleWithTranslation[]> {
  const rows = await db
    .select({
      article: articles,
      translation: articleTranslations,
    })
    .from(articles)
    .innerJoin(
      articleTranslations,
      and(
        eq(articleTranslations.articleId, articles.id),
        eq(articleTranslations.locale, locale),
      ),
    )
    .where(
      and(eq(articles.category, category), eq(articles.status, "published")),
    )
    .orderBy(desc(articles.datePublished), desc(articles.createdAt));

  return rows.map((row) => ({
    id: row.article.id,
    slug: row.article.slug,
    category: row.article.category as ArticleCategoryValue,
    datePublished: row.article.datePublished,
    status: row.article.status as ArticleStatusValue,
    createdAt: row.article.createdAt,
    updatedAt: row.article.updatedAt,
    locale,
    content: parseContent(row.translation.payload),
  }));
}

export type PublishedArticleSummary = {
  slug: string;
  category: ArticleCategoryValue;
  datePublished: string;
  updatedAt: Date;
  titles: Partial<Record<ArticleLocale, string>>;
};

async function fetchAllPublishedArticleSummariesRaw(): Promise<
  PublishedArticleSummary[]
> {
  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      category: articles.category,
      datePublished: articles.datePublished,
      updatedAt: articles.updatedAt,
      locale: articleTranslations.locale,
      payload: articleTranslations.payload,
    })
    .from(articles)
    .innerJoin(
      articleTranslations,
      eq(articleTranslations.articleId, articles.id),
    )
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.datePublished), desc(articles.createdAt));

  const byId = new Map<string, PublishedArticleSummary>();
  for (const row of rows) {
    let summary = byId.get(row.id);
    if (!summary) {
      summary = {
        slug: row.slug,
        category: row.category as ArticleCategoryValue,
        datePublished: row.datePublished,
        updatedAt: row.updatedAt,
        titles: {},
      };
      byId.set(row.id, summary);
    }
    const content = parseContent(row.payload);
    summary.titles[row.locale as ArticleLocale] = content.hero.title;
  }
  return Array.from(byId.values());
}

async function fetchAllPublishedSlugsRaw(): Promise<
  Pick<ArticleRecord, "slug" | "category" | "datePublished" | "updatedAt">[]
> {
  const rows = await db
    .select({
      slug: articles.slug,
      category: articles.category,
      datePublished: articles.datePublished,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.datePublished));

  return rows.map((r) => ({
    slug: r.slug,
    category: r.category as ArticleCategoryValue,
    datePublished: r.datePublished,
    updatedAt: r.updatedAt,
  }));
}

export const getArticle = (
  category: ArticleCategoryValue,
  slug: string,
  locale: ArticleLocale,
) =>
  unstable_cache(
    () => fetchArticleBySlugRaw(category, slug, locale),
    ["article", category, slug, locale],
    { tags: [articleCacheTag(category, slug)] },
  )();

export const getPublishedArticlesByCategory = (
  category: ArticleCategoryValue,
  locale: ArticleLocale,
) =>
  unstable_cache(
    () => fetchPublishedByCategoryRaw(category, locale),
    ["articles", "hub", category, locale],
    { tags: [hubCacheTag(category), allArticlesCacheTag] },
  )();

export const getAllPublishedSlugs = () =>
  unstable_cache(() => fetchAllPublishedSlugsRaw(), ["articles", "all-slugs"], {
    tags: [allArticlesCacheTag],
  })();

export const getAllPublishedArticleSummaries = () =>
  unstable_cache(
    () => fetchAllPublishedArticleSummariesRaw(),
    ["articles", "all-summaries"],
    { tags: [allArticlesCacheTag] },
  )();

export async function getArticleWithAllTranslations(
  id: string,
): Promise<ArticleWithAllTranslations | null> {
  const articleRows = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  const article = articleRows[0];
  if (!article) return null;

  const translationRows = await db
    .select()
    .from(articleTranslations)
    .where(eq(articleTranslations.articleId, id));

  const translations: Partial<Record<ArticleLocale, ArticleContent>> = {};
  for (const t of translationRows) {
    translations[t.locale as ArticleLocale] = parseContent(t.payload);
  }

  return {
    id: article.id,
    slug: article.slug,
    category: article.category as ArticleCategoryValue,
    datePublished: article.datePublished,
    status: article.status as ArticleStatusValue,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    translations,
  };
}

export async function listAllArticles(): Promise<ArticleWithAllTranslations[]> {
  const allArticles = await db
    .select()
    .from(articles)
    .orderBy(desc(articles.updatedAt));

  if (allArticles.length === 0) return [];

  const allTranslations = await db.select().from(articleTranslations);

  const byArticle = new Map<
    string,
    Partial<Record<ArticleLocale, ArticleContent>>
  >();
  for (const t of allTranslations) {
    const map = byArticle.get(t.articleId) ?? {};
    map[t.locale as ArticleLocale] = parseContent(t.payload);
    byArticle.set(t.articleId, map);
  }

  return allArticles.map((a) => ({
    id: a.id,
    slug: a.slug,
    category: a.category as ArticleCategoryValue,
    datePublished: a.datePublished,
    status: a.status as ArticleStatusValue,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    translations: byArticle.get(a.id) ?? {},
  }));
}
