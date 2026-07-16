import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { after } from "next/server";
import { getTranslations } from "next-intl/server";

import { BreadcrumbBar, JsonLd } from "@/components/article/sections";
import {
  changelogProseClasses,
  DownloadButtons,
  SectionSummaryRow,
} from "@/components/changelog/sections";
import { AnimateIn } from "@/components/landing/AnimateIn";
import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";
import { getAllReleases, type ReleaseRecord } from "@/db/releases";
import {
  localeAlternates,
  localePathPrefix,
  metaFor,
} from "@/i18n/locale-meta";
import { Link } from "@/i18n/navigation";
import { summarizeNotes } from "@/lib/changelog-parser";
import { renderChangelogMarkdown } from "@/lib/changelog-render";
import { syncLatestReleaseSafe } from "@/lib/changelog-sync";
import { siteConfig } from "@/lib/site-config";

type LocaleParam = { params: Promise<{ locale: string }> };

const formatDate = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(metaFor(locale).dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

const formatMonth = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(metaFor(locale).dateLocale, {
    year: "numeric",
    month: "long",
  }).format(date);

// Release notes are authored in only two languages (the `notes_en` / `notes_zh`
// columns), so every other locale reads the English notes inside an otherwise
// translated page. Widening this means reshaping the notes columns into a
// locale-keyed map.
const pickNotes = (release: ReleaseRecord, locale: string) =>
  locale === "zh" ? release.notesZh : release.notesEn;

const stripVersionHeading = (notes: string) =>
  notes.replace(/^##\s+.+\s*\n+/m, "").trim();

const platformOrder = [
  "darwin-aarch64",
  "darwin-x86_64",
  "windows-x86_64",
  "linux-x86_64",
];

const orderedPlatforms = (
  platforms: ReleaseRecord["platforms"],
): { key: string; url: string }[] => {
  const entries = Object.entries(platforms).map(([key, value]) => ({
    key,
    url: value.url,
  }));
  entries.sort((a, b) => {
    const ai = platformOrder.indexOf(a.key);
    const bi = platformOrder.indexOf(b.key);
    if (ai === -1 && bi === -1) return a.key.localeCompare(b.key);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return entries;
};

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: LocaleParam): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "changelogHub" });
  const canonical = `${localePathPrefix(locale)}/changelog`;
  const title = t("seoTitle");
  const description = t("seoDescription");
  const meta = metaFor(locale);
  const ogImage = {
    url: meta.ogImage,
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
      languages: localeAlternates("/changelog"),
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${canonical}`,
      type: "website",
      siteName: siteConfig.brand,
      locale: meta.ogLocale,
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

export default async function ChangelogPage({ params }: LocaleParam) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "changelogHub" });

  // Lazy refresh in the background — never blocks rendering.
  after(() => syncLatestReleaseSafe());

  const releases = await getAllReleases();
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const homePath = localePathPrefix(locale) || "/";
  const canonical = `${localePathPrefix(locale)}/changelog`;
  const pageUrl = `${baseUrl}${canonical}`;

  const latest = releases[0] ?? null;

  const renderedById = await Promise.all(
    releases.map(async (release) => {
      const notes = stripVersionHeading(pickNotes(release, locale));
      const html = await renderChangelogMarkdown(
        `${release.id}:${locale}:${release.updatedAt.toISOString()}`,
        notes,
      );
      const summary = summarizeNotes(pickNotes(release, locale));
      return { id: release.id, html, summary };
    }),
  );
  const renderedMap = new Map(renderedById.map((r) => [r.id, r]));

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("seoTitle"),
    description: t("seoDescription"),
    inLanguage: metaFor(locale).inLanguage,
    url: pageUrl,
    numberOfItems: releases.length,
    itemListElement: releases.map((release, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}${localePathPrefix(locale)}/changelog/${release.version}`,
      name: `v${release.version}`,
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
            {latest && (
              <AnimateIn delay={0.18} duration={0.5}>
                <div className="border-border bg-bg2/50 mt-9 flex flex-col gap-5 rounded-[14px] border p-6 md:flex-row md:items-center md:justify-between md:p-7">
                  <div>
                    <p
                      className="text-muted2"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {t("latestLabel")}
                    </p>
                    <div className="text-foreground mt-2 flex items-baseline gap-3">
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "clamp(1.5rem, 3.2vw, 2rem)",
                          fontWeight: 600,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        v{latest.version}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {formatDate(latest.pubDate, locale)}
                      </span>
                    </div>
                  </div>
                  <DownloadButtons
                    entries={orderedPlatforms(latest.platforms)}
                    label={t("downloadLabel")}
                  />
                </div>
              </AnimateIn>
            )}
          </div>
        </section>

        <section className="bg-background py-[72px] md:py-[100px]">
          <div className="landing-shell">
            {releases.length === 0 ? (
              <p
                className="text-muted-foreground"
                style={{ fontSize: 16, lineHeight: 1.6 }}
              >
                {t("emptyState")}
              </p>
            ) : (
              <ol className="m-0 list-none p-0">
                {releases.map((release, i) => {
                  const rendered = renderedMap.get(release.id);
                  const prev = releases[i - 1];
                  const showMonth =
                    !prev ||
                    formatMonth(prev.pubDate, locale) !==
                      formatMonth(release.pubDate, locale);
                  const detailHref = `/changelog/${release.version}`;
                  return (
                    <li
                      key={release.id}
                      id={`v${release.version}`}
                      className="grid scroll-mt-28 gap-x-6 gap-y-3 md:grid-cols-[160px_1fr]"
                    >
                      <div className="md:sticky md:top-24 md:self-start">
                        {showMonth && (
                          <p
                            className="text-muted-foreground"
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              letterSpacing: "0.04em",
                            }}
                          >
                            {formatMonth(release.pubDate, locale)}
                          </p>
                        )}
                        <p
                          className="text-muted2 mt-1"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            letterSpacing: "0.04em",
                          }}
                        >
                          <time dateTime={release.pubDate.toISOString()}>
                            {formatDate(release.pubDate, locale)}
                          </time>
                        </p>
                      </div>
                      <article className="border-border bg-background relative mb-12 rounded-[14px] border p-6 md:p-8">
                        <header className="border-border flex flex-wrap items-baseline justify-between gap-3 border-b pb-4">
                          <h2
                            className="text-foreground"
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "clamp(1.25rem, 2.2vw, 1.5rem)",
                              fontWeight: 600,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            <Link
                              href={detailHref}
                              className="hover:text-foreground/80 no-underline"
                            >
                              v{release.version}
                            </Link>
                          </h2>
                          <a
                            href={`#v${release.version}`}
                            className="text-muted2 hover:text-foreground"
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              letterSpacing: "0.04em",
                            }}
                            aria-label={t("permalink")}
                          >
                            #v{release.version}
                          </a>
                        </header>
                        {rendered?.summary?.sections && (
                          <SectionSummaryRow
                            sections={rendered.summary.sections}
                          />
                        )}
                        {rendered?.html && (
                          <div
                            className={changelogProseClasses}
                            dangerouslySetInnerHTML={{ __html: rendered.html }}
                          />
                        )}
                        <div className="border-border mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                          <Link
                            href={detailHref}
                            className="text-foreground inline-flex items-center gap-1.5 text-sm font-medium hover:gap-2"
                          >
                            {t("viewVersion", { version: release.version })}
                            <ChevronRight aria-hidden className="size-3.5" />
                          </Link>
                          <DownloadButtons
                            entries={orderedPlatforms(release.platforms)}
                            label={t("downloadShort")}
                          />
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <JsonLd data={[itemListSchema, breadcrumbSchema]} />
    </>
  );
}
