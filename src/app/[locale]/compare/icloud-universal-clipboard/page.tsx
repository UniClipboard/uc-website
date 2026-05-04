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

const PAGE_PATH = "/compare/icloud-universal-clipboard";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "compare.icloud" });

  const isDefault = locale === "en";
  const canonical = isDefault ? PAGE_PATH : `/${locale}${PAGE_PATH}`;
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
        en: PAGE_PATH,
        zh: `/zh${PAGE_PATH}`,
        "x-default": PAGE_PATH,
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

const ComparePage = async ({ params }: PageProps) => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "compare.icloud" });

  const tldrItems = t.raw("tldrItems") as string[];
  const switchSteps = t.raw("switchSteps") as string[];
  const rawRows = t.raw("rows") as Array<{
    feature: string;
    uc: string;
    icloud: string;
  }>;
  const rows: ComparisonRow[] = rawRows.map((r) => ({
    feature: r.feature,
    uc: r.uc,
    other: r.icloud,
  }));
  const faqItems = t.raw("faqItems") as FaqItem[];

  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const homePath = locale === "en" ? "/" : `/${locale}`;
  const canonical = locale === "en" ? PAGE_PATH : `/${locale}${PAGE_PATH}`;
  const pageUrl = `${baseUrl}${canonical}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t("seoTitle"),
    description: t("seoDescription"),
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    datePublished: "2026-05-04",
    dateModified: t("lastUpdatedDate"),
    mainEntityOfPage: pageUrl,
    author: { "@type": "Organization", name: siteConfig.brand, url: baseUrl },
    publisher: {
      "@type": "Organization",
      name: siteConfig.brand,
      url: baseUrl,
    },
    about: [
      { "@type": "SoftwareApplication", name: "UniClipboard" },
      { "@type": "SoftwareApplication", name: "iCloud Universal Clipboard" },
    ],
  };

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
        name: t("breadcrumbCompare"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: t("breadcrumbCurrent"),
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <Navigation />
      <Article>
        <ArticleHero
          breadcrumbs={[
            { label: t("breadcrumbHome"), href: "/" },
            { label: t("breadcrumbCompare") },
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
          otherHeader={t("tableHeader.icloud")}
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
      <JsonLd data={[articleSchema, faqSchema, breadcrumbSchema]} />
    </>
  );
};

export default ComparePage;
