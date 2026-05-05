import { and, eq, ne } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

import {
  allArticlesCacheTag,
  articleCacheTag,
  getArticleWithAllTranslations,
  hubCacheTag,
} from "@/db/articles";
import { db } from "@/db/client";
import { articles, articleTranslations } from "@/db/schema";
import { requireApiToken } from "@/lib/api-token";
import {
  type ArticleCategoryValue,
  articleUpsertSchema,
} from "@/lib/article-content";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireApiToken(req);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await ctx.params;
  const article = await getArticleWithAllTranslations(id);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    await requireApiToken(req);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await ctx.params;

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
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const previous = existing[0];
  const previousCategory = previous.category as ArticleCategoryValue;

  const conflict = await db
    .select({ id: articles.id })
    .from(articles)
    .where(
      and(
        eq(articles.category, parsed.category),
        eq(articles.slug, parsed.slug),
        ne(articles.id, id),
      ),
    )
    .limit(1);
  if (conflict.length > 0) {
    return NextResponse.json(
      { error: "Another article already uses this category and slug." },
      { status: 409 },
    );
  }

  await db
    .update(articles)
    .set({
      slug: parsed.slug,
      category: parsed.category,
      datePublished: parsed.datePublished,
      status: parsed.status,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id));

  for (const locale of ["en", "zh"] as const) {
    await db
      .insert(articleTranslations)
      .values({
        articleId: id,
        locale,
        payload: parsed.translations[locale],
      })
      .onConflictDoUpdate({
        target: [articleTranslations.articleId, articleTranslations.locale],
        set: {
          payload: parsed.translations[locale],
          updatedAt: new Date(),
        },
      });
  }

  revalidateTag(articleCacheTag(previousCategory, previous.slug));
  revalidateTag(articleCacheTag(parsed.category, parsed.slug));
  revalidateTag(hubCacheTag(previousCategory));
  revalidateTag(hubCacheTag(parsed.category));
  revalidateTag(allArticlesCacheTag);

  return NextResponse.json({ id });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    await requireApiToken(req);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await ctx.params;

  const existing = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const article = existing[0];
  const articleCategory = article.category as ArticleCategoryValue;

  await db.delete(articles).where(eq(articles.id, id));

  revalidateTag(articleCacheTag(articleCategory, article.slug));
  revalidateTag(hubCacheTag(articleCategory));
  revalidateTag(allArticlesCacheTag);

  return NextResponse.json({ ok: true });
}
