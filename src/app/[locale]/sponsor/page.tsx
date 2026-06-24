import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";
import { SponsorBenefits } from "@/components/landing/SponsorBenefits";
import { SponsorCta } from "@/components/landing/SponsorCta";
import { SponsorHero } from "@/components/landing/SponsorHero";
import { SponsorWall } from "@/components/landing/SponsorWall";
import { siteConfig } from "@/lib/site-config";

// Sponsors are DB-backed but change rarely, so the wall renders statically and
// is rebuilt on demand: the list is cached under SPONSORS_PUBLIC_CACHE_TAG (see
// sponsors-store) and every admin mutation calls `revalidateTag` to refresh it.
// The 30-min ISR window is a safety net in case a revalidation is ever missed.
export const revalidate = 1800;

type LocaleParam = { params: Promise<{ locale: string }> };

const localePathPrefix = (locale: string) =>
  locale === "en" ? "" : `/${locale}`;

export async function generateMetadata({
  params,
}: LocaleParam): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.sponsor" });
  const canonical = `${localePathPrefix(locale)}/sponsor`;
  const title = t("seoTitle");
  const description = t("seoDescription");
  const ogImage = {
    url: locale === "zh" ? "/og-zh.jpg" : "/og-en.jpg",
    width: 1730,
    height: 909,
    alt: t("ogAlt"),
  };
  return {
    title,
    description,
    keywords: t("seoKeywords")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    alternates: {
      canonical,
      languages: {
        en: "/sponsor",
        zh: "/zh/sponsor",
        "x-default": "/sponsor",
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${canonical}`,
      type: "website",
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

export default async function SponsorPage({ params }: LocaleParam) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.sponsor" });

  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const pageUrl = `${baseUrl}${localePathPrefix(locale)}/sponsor`;

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("seoTitle"),
    description: t("seoDescription"),
    url: pageUrl,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    isPartOf: {
      "@type": "WebSite",
      name: "UniClipboard",
      url: baseUrl,
    },
  };

  return (
    <>
      <Navigation />
      <main>
        <SponsorHero />
        <SponsorBenefits />
        <SponsorWall />
        <SponsorCta />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
    </>
  );
}
