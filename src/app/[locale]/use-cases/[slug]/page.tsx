import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ArticleLayout,
  buildArticleMetadata,
} from "@/components/article/ArticleLayout";
import { getAllPublishedSlugs, getArticle } from "@/db/articles";
import type { ArticleLocale } from "@/lib/article-content";

const CATEGORY = "use-cases" as const;

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const all = await getAllPublishedSlugs();
  return all
    .filter((a) => a.category === CATEGORY)
    .flatMap((a) => [
      { locale: "en", slug: a.slug },
      { locale: "zh", slug: a.slug },
    ]);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticle(CATEGORY, slug, locale as ArticleLocale);
  if (!article || article.content.contentType !== "template") return {};
  return buildArticleMetadata(
    {
      slug: article.slug,
      category: CATEGORY,
      datePublished: article.datePublished,
    },
    article.content,
    locale,
  );
}

export default async function UseCaseArticlePage({ params }: PageProps) {
  const { locale, slug } = await params;
  const article = await getArticle(CATEGORY, slug, locale as ArticleLocale);
  if (!article || article.content.contentType !== "template") notFound();

  return (
    <ArticleLayout
      entry={{
        slug: article.slug,
        category: CATEGORY,
        datePublished: article.datePublished,
      }}
      content={article.content}
      locale={locale as ArticleLocale}
    />
  );
}
