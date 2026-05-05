import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import {
  Article,
  ArticleHero,
  ComparisonTable,
  CtaCard,
  FaqGrid,
  JsonLd,
  StepsSection,
  TldrSection,
  TwoColumnSection,
  VerdictSection,
} from "@/components/article/sections";
import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";
import type {
  ArticleCategoryValue,
  ArticleLocale,
  TemplateArticleContent,
} from "@/lib/article-content";
import { siteConfig } from "@/lib/site-config";

const localePathPrefix = (locale: string) =>
  locale === "en" ? "" : `/${locale}`;

type TemplateCategory = Exclude<ArticleCategoryValue, "blog">;

const HUB_BASE_PATH: Record<TemplateCategory, string> = {
  compare: "/compare",
  "use-cases": "/use-cases",
};

const HUB_NAMESPACE: Record<TemplateCategory, string> = {
  compare: "compareHub",
  "use-cases": "useCasesHub",
};

export type ArticleEntry = {
  slug: string;
  category: TemplateCategory;
  datePublished: string;
};

const articlePagePath = (entry: ArticleEntry) =>
  `${HUB_BASE_PATH[entry.category]}/${entry.slug}`;

export async function buildArticleMetadata(
  entry: ArticleEntry,
  content: TemplateArticleContent,
  locale: string,
): Promise<Metadata> {
  const pagePath = articlePagePath(entry);
  const canonical = `${localePathPrefix(locale)}${pagePath}`;
  const keywords = content.seo.keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const ogImage = {
    url: locale === "zh" ? "/og-zh.jpg" : "/og-en.jpg",
    width: 1730,
    height: 909,
    alt: content.seo.ogAlt,
  };

  return {
    title: content.seo.title,
    description: content.seo.description,
    keywords,
    alternates: {
      canonical,
      languages: {
        en: pagePath,
        zh: `/zh${pagePath}`,
        "x-default": pagePath,
      },
    },
    openGraph: {
      title: content.seo.title,
      description: content.seo.description,
      url: `${siteConfig.url}${canonical}`,
      type: "article",
      siteName: siteConfig.brand,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: content.seo.title,
      description: content.seo.description,
      images: [ogImage],
    },
  };
}

export async function ArticleLayout({
  entry,
  content,
  locale,
}: {
  entry: ArticleEntry;
  content: TemplateArticleContent;
  locale: ArticleLocale;
}) {
  const hubT = await getTranslations({
    locale,
    namespace: HUB_NAMESPACE[entry.category],
  });
  const breadcrumbHome = hubT("breadcrumbHome");
  const breadcrumbParent = hubT("breadcrumbCurrent");

  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const homePath = locale === "en" ? "/" : `/${locale}`;
  const pagePath = articlePagePath(entry);
  const canonical = `${localePathPrefix(locale)}${pagePath}`;
  const pageUrl = `${baseUrl}${canonical}`;
  const parentPath = HUB_BASE_PATH[entry.category];
  const parentUrl = `${baseUrl}${localePathPrefix(locale)}${parentPath}`;

  const aboutEntries = [
    { "@type": "SoftwareApplication" as const, name: "UniClipboard" },
    ...(content.about ?? []).map((name) => ({
      "@type": "SoftwareApplication" as const,
      name,
    })),
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.seo.title,
    description: content.seo.description,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    datePublished: entry.datePublished,
    dateModified: content.meta.lastUpdatedDate,
    mainEntityOfPage: pageUrl,
    author: { "@type": "Organization", name: siteConfig.brand, url: baseUrl },
    publisher: {
      "@type": "Organization",
      name: siteConfig.brand,
      url: baseUrl,
    },
    about: aboutEntries,
  };

  const howToSchema = content.howTo
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: content.steps.title,
        description: content.seo.description,
        inLanguage: locale === "zh" ? "zh-CN" : "en",
        ...(content.howTo.totalTime
          ? { totalTime: content.howTo.totalTime }
          : {}),
        tool: content.howTo.tools.map((name) => ({
          "@type": "HowToTool",
          name,
        })),
        step: content.steps.items.map((step, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: step.split(/[.。]/)[0],
          text: step,
          url: `${pageUrl}#how-to-set-it-up`,
        })),
      }
    : null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: breadcrumbHome,
        item: `${baseUrl}${homePath}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: breadcrumbParent,
        item: parentUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: content.meta.breadcrumbCurrent,
        item: pageUrl,
      },
    ],
  };

  const jsonLdData = [
    articleSchema,
    ...(howToSchema ? [howToSchema] : []),
    faqSchema,
    breadcrumbSchema,
  ];

  return (
    <>
      <Navigation />
      <Article>
        <ArticleHero
          breadcrumbs={[
            { label: breadcrumbHome, href: "/" },
            { label: breadcrumbParent, href: parentPath },
            { label: content.meta.breadcrumbCurrent },
          ]}
          eyebrow={content.hero.eyebrow}
          title={content.hero.title}
          subtitle={content.hero.subtitle}
          lede={content.hero.lede}
          lastUpdatedLabel={content.meta.lastUpdatedLabel}
          lastUpdatedDate={content.meta.lastUpdatedDate}
        />
        <TldrSection
          eyebrow={content.tldr.eyebrow}
          title={content.tldr.title}
          items={content.tldr.items}
        />
        <TwoColumnSection
          left={content.twoColumn.left}
          right={content.twoColumn.right}
        />
        <ComparisonTable
          eyebrow={content.comparison.eyebrow}
          title={content.comparison.title}
          featureHeader={content.comparison.headers.feature}
          ucHeader={content.comparison.headers.uc}
          otherHeader={content.comparison.headers.other}
          rows={content.comparison.rows}
          note={content.comparison.note || undefined}
        />
        <StepsSection
          eyebrow={content.steps.eyebrow}
          title={content.steps.title}
          steps={content.steps.items}
        />
        <VerdictSection
          eyebrow={content.verdict.eyebrow}
          title={content.verdict.title}
          body={content.verdict.body}
        />
        <FaqGrid
          eyebrow={content.faq.eyebrow}
          title={content.faq.title}
          items={content.faq.items}
        />
        <CtaCard
          eyebrow={content.cta.eyebrow}
          title={content.cta.title}
          body={content.cta.body}
          primary={{ label: content.cta.primary, href: "/#download" }}
          secondary={{ label: content.cta.secondary, href: "/blog/whitepaper" }}
        />
      </Article>
      <Footer />
      <JsonLd data={jsonLdData} />
    </>
  );
}
