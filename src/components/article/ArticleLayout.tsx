import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import {
  Article,
  ArticleHero,
  type ComparisonRow,
  ComparisonTable,
  CtaCard,
  FaqGrid,
  type FaqItem,
  JsonLd,
  StepsSection,
  TldrSection,
  TwoColumnSection,
  VerdictSection,
} from "@/components/article/sections";
import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";
import { siteConfig } from "@/lib/site-config";

export type ArticleConfig = {
  pagePath: string;
  namespace: string;
  breadcrumbMiddleKey: string;
  datePublished: string;
  about?: string[];
  howTo?: {
    tools: string[];
    totalTime?: string;
  };
};

const localePathPrefix = (locale: string) =>
  locale === "en" ? "" : `/${locale}`;

export async function buildArticleMetadata(
  config: ArticleConfig,
  locale: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: config.namespace });

  const canonical = `${localePathPrefix(locale)}${config.pagePath}`;
  const title = t("seoTitle");
  const description = t("seoDescription");
  const keywords = t("seoKeywords")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const ogImage = {
    url: locale === "zh" ? "/og-zh.jpg" : "/og-en.jpg",
    width: 1730,
    height: 909,
    alt: t("ogAlt"),
  };

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages: {
        en: config.pagePath,
        zh: `/zh${config.pagePath}`,
        "x-default": config.pagePath,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${canonical}`,
      type: "article",
      siteName: siteConfig.brand,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

type PageProps = {
  config: ArticleConfig;
  locale: string;
};

export async function ArticleLayout({ config, locale }: PageProps) {
  const t = await getTranslations({ locale, namespace: config.namespace });

  const tldrItems = t.raw("tldrItems") as string[];
  const switchSteps = t.raw("switchSteps") as string[];
  const rows = t.raw("rows") as ComparisonRow[];
  const faqItems = t.raw("faqItems") as FaqItem[];

  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const homePath = locale === "en" ? "/" : `/${locale}`;
  const canonical = `${localePathPrefix(locale)}${config.pagePath}`;
  const pageUrl = `${baseUrl}${canonical}`;
  const parentPath = config.pagePath.split("/").slice(0, -1).join("/") || "/";
  const parentUrl = `${baseUrl}${localePathPrefix(locale)}${parentPath}`;

  const aboutEntries = [
    { "@type": "SoftwareApplication" as const, name: "UniClipboard" },
    ...(config.about ?? []).map((name) => ({
      "@type": "SoftwareApplication" as const,
      name,
    })),
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t("seoTitle"),
    description: t("seoDescription"),
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    datePublished: config.datePublished,
    dateModified: t("lastUpdatedDate"),
    mainEntityOfPage: pageUrl,
    author: { "@type": "Organization", name: siteConfig.brand, url: baseUrl },
    publisher: {
      "@type": "Organization",
      name: siteConfig.brand,
      url: baseUrl,
    },
    about: aboutEntries,
  };

  const howToSchema = config.howTo
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: t("switchTitle"),
        description: t("seoDescription"),
        inLanguage: locale === "zh" ? "zh-CN" : "en",
        ...(config.howTo.totalTime
          ? { totalTime: config.howTo.totalTime }
          : {}),
        tool: config.howTo.tools.map((name) => ({
          "@type": "HowToTool",
          name,
        })),
        step: switchSteps.map((step, i) => ({
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
    mainEntity: faqItems.map((item) => ({
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
        name: t("breadcrumbHome"),
        item: `${baseUrl}${homePath}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t(config.breadcrumbMiddleKey),
        item: parentUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: t("breadcrumbCurrent"),
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
            { label: t("breadcrumbHome"), href: "/" },
            { label: t(config.breadcrumbMiddleKey), href: parentPath },
            { label: t("breadcrumbCurrent") },
          ]}
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
          lede={t("lede")}
          lastUpdatedLabel={t("lastUpdatedLabel")}
          lastUpdatedDate={t("lastUpdatedDate")}
        />
        <TldrSection
          eyebrow={t("tldrEyebrow")}
          title={t("tldrTitle")}
          items={tldrItems}
        />
        <TwoColumnSection
          left={{
            eyebrow: t("section1Eyebrow"),
            title: t("section1Title"),
            body: t("section1Body"),
          }}
          right={{
            eyebrow: t("section2Eyebrow"),
            title: t("section2Title"),
            body: t("section2Body"),
          }}
        />
        <ComparisonTable
          eyebrow={t("tableEyebrow")}
          title={t("tableTitle")}
          featureHeader={t("tableHeader.feature")}
          ucHeader={t("tableHeader.uc")}
          otherHeader={t("tableHeader.other")}
          rows={rows}
          note={t("tableNote")}
        />
        <StepsSection
          eyebrow={t("switchEyebrow")}
          title={t("switchTitle")}
          steps={switchSteps}
        />
        <VerdictSection
          eyebrow={t("verdictEyebrow")}
          title={t("verdictTitle")}
          body={t("verdictBody")}
        />
        <FaqGrid
          eyebrow={t("faqEyebrow")}
          title={t("faqTitle")}
          items={faqItems}
        />
        <CtaCard
          eyebrow={t("ctaEyebrow")}
          title={t("ctaTitle")}
          body={t("ctaBody")}
          primary={{ label: t("ctaPrimary"), href: "/#download" }}
          secondary={{ label: t("ctaSecondary"), href: "/whitepaper" }}
        />
      </Article>
      <Footer />
      <JsonLd data={jsonLdData} />
    </>
  );
}
