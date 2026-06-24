import { getTranslations } from "next-intl/server";
import { ImageResponse } from "takumi-js/response";

import { OG_CONTENT_TYPE, OG_SIZE, OgFrame } from "@/components/og/OgFrame";
import { getAllPublishedSlugs } from "@/db/articles";
import type { ArticleLocale } from "@/lib/article-content";
import { loadOgFonts } from "@/lib/og/fonts";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "UniClipboard blog post";

// Prebuild one image per published blog article (× locale) at build time so the
// takumi render + DB lookup + runtime font fetch don't run on every crawler hit.
export async function generateStaticParams() {
  const all = await getAllPublishedSlugs();
  return all
    .filter((a) => a.category === "blog")
    .flatMap((a) => [
      { locale: "en", slug: a.slug },
      { locale: "zh", slug: a.slug },
    ]);
}

type Params = { params: Promise<{ locale: string; slug: string }> };

async function loadArticleHero(slug: string, locale: string) {
  try {
    const { getArticle } = await import("@/db/articles");
    const article = await getArticle("blog", slug, locale as ArticleLocale);
    if (!article || article.content.contentType !== "markdown") return null;
    return {
      title: article.content.hero.title,
      subtitle:
        article.content.hero.subtitle?.trim() ||
        article.content.seo.description,
    };
  } catch {
    return null;
  }
}

export default async function Image({ params }: Params) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "og.blog" });

  const hero = await loadArticleHero(slug, locale);

  const eyebrow = t("eyebrow");
  const title = hero?.title ?? t("subtitle");
  const subtitle = hero?.subtitle ?? t("subtitle");

  const fonts = await loadOgFonts(locale, `${eyebrow}${title}${subtitle}`);

  return new ImageResponse(
    <OgFrame
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      locale={locale}
      footer={`uniclipboard.app/blog/${slug}`}
    />,
    { ...OG_SIZE, fonts },
  );
}
