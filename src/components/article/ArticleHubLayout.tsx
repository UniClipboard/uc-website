import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AnimateIn } from "@/components/landing/AnimateIn";
import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";
import { Link } from "@/i18n/navigation";
import {
  type ArticleCategory,
  articleHref,
  type ArticleManifestEntry,
  articlesByCategory,
} from "@/lib/articles";
import { siteConfig } from "@/lib/site-config";

import { BreadcrumbBar, JsonLd } from "./sections";

export type HubConfig = {
  category: ArticleCategory;
  pagePath: string;
  namespace: string;
};

const localePathPrefix = (locale: string) =>
  locale === "en" ? "" : `/${locale}`;

export async function buildHubMetadata(
  config: HubConfig,
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

type HubProps = {
  config: HubConfig;
  locale: string;
};

type ArticleCardData = {
  entry: ArticleManifestEntry;
  title: string;
  subtitle: string;
  lastUpdatedDate: string;
};

async function loadCards(
  entries: ArticleManifestEntry[],
  locale: string,
): Promise<ArticleCardData[]> {
  return Promise.all(
    entries.map(async (entry) => {
      const t = await getTranslations({ locale, namespace: entry.namespace });
      return {
        entry,
        title: t("title"),
        subtitle: t("subtitle"),
        lastUpdatedDate: t("lastUpdatedDate"),
      };
    }),
  );
}

export async function ArticleHubLayout({ config, locale }: HubProps) {
  const t = await getTranslations({ locale, namespace: config.namespace });
  const entries = articlesByCategory(config.category);
  const cards = await loadCards(entries, locale);

  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const homePath = locale === "en" ? "/" : `/${locale}`;
  const canonical = `${localePathPrefix(locale)}${config.pagePath}`;
  const pageUrl = `${baseUrl}${canonical}`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("seoTitle"),
    description: t("seoDescription"),
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    url: pageUrl,
    isPartOf: { "@type": "WebSite", name: siteConfig.brand, url: baseUrl },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: cards.map((card, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${baseUrl}${localePathPrefix(locale)}${articleHref(card.entry)}`,
        name: card.title,
      })),
    },
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
        name: t("breadcrumbCurrent"),
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <Navigation />
      <main>
        <section className="border-border bg-background border-b pt-28 pb-14 md:pt-36 md:pb-20">
          <div className="landing-shell">
            <BreadcrumbBar
              items={[
                { label: t("breadcrumbHome"), href: "/" },
                { label: t("breadcrumbCurrent") },
              ]}
            />
            <AnimateIn variant="fade-in" duration={0.5}>
              <p className="landing-kicker">{t("eyebrow")}</p>
            </AnimateIn>
            <AnimateIn delay={0.05} duration={0.6}>
              <h1
                className="text-foreground mt-3.5 mb-5"
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.25rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  maxWidth: 880,
                  textWrap: "balance",
                }}
              >
                {t("title")}
              </h1>
            </AnimateIn>
            <AnimateIn delay={0.1} duration={0.5}>
              <p
                className="text-muted-foreground"
                style={{ fontSize: 18, lineHeight: 1.55, maxWidth: 720 }}
              >
                {t("subtitle")}
              </p>
            </AnimateIn>
            <AnimateIn delay={0.16} duration={0.5}>
              <p
                className="text-muted2 mt-8 inline-flex items-center gap-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                }}
              >
                <span>{t("countLabel", { count: cards.length })}</span>
              </p>
            </AnimateIn>
          </div>
        </section>

        <section className="bg-bg2 border-border border-b py-[72px] md:py-[100px]">
          <div className="landing-shell">
            {cards.length === 0 ? (
              <p
                className="text-muted-foreground"
                style={{ fontSize: 16, lineHeight: 1.6 }}
              >
                {t("emptyState")}
              </p>
            ) : (
              <ul className="grid list-none gap-5 p-0 md:grid-cols-2 md:gap-6">
                {cards.map((card) => (
                  <li key={card.entry.slug} className="m-0">
                    <Link
                      href={articleHref(card.entry)}
                      className="border-border bg-background hover:border-foreground/30 group block h-full rounded-[14px] border p-7 transition-colors md:p-8"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <span className="landing-kicker">
                          {t("categoryLabel")}
                        </span>
                        <span
                          className="text-muted2"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            letterSpacing: "0.04em",
                          }}
                        >
                          <time dateTime={card.lastUpdatedDate}>
                            {card.lastUpdatedDate}
                          </time>
                        </span>
                      </div>
                      <h2
                        className="text-foreground mb-3"
                        style={{
                          fontSize: "clamp(1.25rem, 2.4vw, 1.5rem)",
                          fontWeight: 600,
                          letterSpacing: "-0.015em",
                          lineHeight: 1.25,
                          textWrap: "balance",
                        }}
                      >
                        {card.title}
                      </h2>
                      <p
                        className="text-muted-foreground mb-6"
                        style={{ fontSize: 15, lineHeight: 1.6 }}
                      >
                        {card.subtitle}
                      </p>
                      <span
                        className="text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
                        style={{ letterSpacing: "-0.005em" }}
                      >
                        {t("readMore")}
                        <ChevronRight
                          aria-hidden
                          className="size-3.5 transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <JsonLd data={[collectionSchema, breadcrumbSchema]} />
    </>
  );
}
