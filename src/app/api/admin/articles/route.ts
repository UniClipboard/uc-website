import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

import {
  allArticlesCacheTag,
  articleCacheTag,
  hubCacheTag,
} from "@/db/articles";
import { db } from "@/db/client";
import { isUniqueConstraint } from "@/db/errors";
import { articles, articleTranslations } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { articleUpsertSchema } from "@/lib/article-content";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
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

  try {
    const inserted = db.transaction(
      (tx) => {
        const [row] = tx
          .insert(articles)
          .values({
            slug: parsed.slug,
            category: parsed.category,
            datePublished: parsed.datePublished,
            status: parsed.status,
          })
          .returning()
          .all();

        tx.insert(articleTranslations)
          .values([
            {
              articleId: row.id,
              locale: "en",
              payload: parsed.translations.en,
            },
            {
              articleId: row.id,
              locale: "zh",
              payload: parsed.translations.zh,
            },
          ])
          .run();
        return row;
      },
      { behavior: "immediate" },
    );

    revalidateTag(articleCacheTag(parsed.category, parsed.slug));
    revalidateTag(hubCacheTag(parsed.category));
    revalidateTag(allArticlesCacheTag);

    return NextResponse.json({ id: inserted.id }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraint(error))
      return NextResponse.json(
        { error: "An article with this category and slug already exists." },
        { status: 409 },
      );
    throw error;
  }
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const rows = await db.select().from(articles);
  return NextResponse.json({ articles: rows });
}
