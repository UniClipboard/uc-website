import { and, desc, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

import {
  allArticlesCacheTag,
  articleCacheTag,
  hubCacheTag,
} from "@/db/articles";
import { db } from "@/db/client";
import { articles, articleTranslations } from "@/db/schema";
import { requireApiToken } from "@/lib/api-token";
import {
  ARTICLE_CATEGORIES,
  type ArticleCategoryValue,
  articleUpsertSchema,
} from "@/lib/article-content";

export const runtime = "nodejs";

const isCategory = (value: string | null): value is ArticleCategoryValue =>
  value !== null && (ARTICLE_CATEGORIES as readonly string[]).includes(value);

export async function POST(req: NextRequest) {
  try {
    await requireApiToken(req);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  let parsed;
  try {
    const body = await req.json();
    parsed = articleUpsertSchema.parse(body);
  } catch (e) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 400 },
    );
  }

  const existing = await db
    .select({ id: articles.id })
    .from(articles)
    .where(
      and(
        eq(articles.category, parsed.category),
        eq(articles.slug, parsed.slug),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An article with this category and slug already exists." },
      { status: 409 },
    );
  }

  const [inserted] = await db
    .insert(articles)
    .values({
      slug: parsed.slug,
      category: parsed.category,
      datePublished: parsed.datePublished,
      status: parsed.status,
    })
    .returning();

  await db.insert(articleTranslations).values([
    { articleId: inserted.id, locale: "en", payload: parsed.translations.en },
    { articleId: inserted.id, locale: "zh", payload: parsed.translations.zh },
  ]);

  revalidateTag(articleCacheTag(parsed.category, parsed.slug));
  revalidateTag(hubCacheTag(parsed.category));
  revalidateTag(allArticlesCacheTag);

  return NextResponse.json(
    { id: inserted.id, slug: inserted.slug, category: inserted.category },
    { status: 201 },
  );
}

export async function GET(req: NextRequest) {
  try {
    await requireApiToken(req);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const categoryParam = req.nextUrl.searchParams.get("category");
  if (categoryParam !== null && !isCategory(categoryParam)) {
    return NextResponse.json(
      {
        error: `Invalid category. Expected one of: ${ARTICLE_CATEGORIES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const rows = categoryParam
    ? await db
        .select()
        .from(articles)
        .where(eq(articles.category, categoryParam))
        .orderBy(desc(articles.updatedAt))
    : await db.select().from(articles).orderBy(desc(articles.updatedAt));

  return NextResponse.json({ articles: rows });
}
