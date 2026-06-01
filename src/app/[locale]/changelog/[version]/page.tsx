import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import {
  getAllReleases,
  getAllReleaseVersions,
  getReleaseByVersion,
  type ReleaseRecord,
} from "@/db/releases";
import { Link } from "@/i18n/navigation";
import { summarizeNotes } from "@/lib/changelog-parser";
import { renderChangelogMarkdown } from "@/lib/changelog-render";
import { syncLatestReleaseSafe } from "@/lib/changelog-sync";
import { siteConfig } from "@/lib/site-config";

type PageParams = { locale: string; version: string };
type PageProps = { params: Promise<PageParams> };

const localePathPrefix = (locale: string) =>
  locale === "en" ? "" : `/${locale}`;

const formatDate = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

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

const pickNotes = (release: ReleaseRecord, locale: string) =>
  locale === "zh" ? release.notesZh : release.notesEn;

const stripVersionHeading = (notes: string) =>
  notes.replace(/^##\s+.+\s*\n+/m, "").trim();

export const revalidate = 1800;

export async function generateStaticParams() {
  const versions = await getAllReleaseVersions();
  return versions.flatMap((row) =>
    ["en", "zh"].map((locale) => ({ locale, version: row.version })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, version } = await params;
  const release = await getReleaseByVersion(version);
  const t = await getTranslations({ locale, namespace: "changelogHub" });

  if (!release) {
    return { title: t("notFoundTitle"), robots: { index: false } };
  }

  const canonical = `${localePathPrefix(locale)}/changelog/${version}`;
  const title = t("detailSeoTitle", { version });
  const description = t("detailSeoDescription", {
    version,
    date: formatDate(release.pubDate, locale),
  });
  const ogImage = {
    url: locale === "zh" ? "/og-zh.jpg" : "/og-en.jpg",
    width: 1730,
    height: 909,
    alt: t("ogAlt"),
  };
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `/changelog/${version}`,
        zh: `/zh/changelog/${version}`,
        "x-default": `/changelog/${version}`,
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
      publishedTime: release.pubDate.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ChangelogVersionPage({ params }: PageProps) {
  const { locale, version } = await params;
  const t = await getTranslations({ locale, namespace: "changelogHub" });

  after(() => syncLatestReleaseSafe());

  const release = await getReleaseByVersion(version);
  if (!release) notFound();

  const releases = await getAllReleases();
  const idx = releases.findIndex((r) => r.version === version);
  const newer = idx > 0 ? releases[idx - 1] : null;
  const older =
    idx >= 0 && idx < releases.length - 1 ? releases[idx + 1] : null;

  const notes = stripVersionHeading(pickNotes(release, locale));
  const html = await renderChangelogMarkdown(
    `${release.id}:${locale}:${release.updatedAt.toISOString()}:detail`,
    notes,
  );
  const summary = summarizeNotes(pickNotes(release, locale));

  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const homePath = locale === "en" ? "/" : `/${locale}`;
  const canonical = `${localePathPrefix(locale)}/changelog/${version}`;
  const pageUrl = `${baseUrl}${canonical}`;
  const parentUrl = `${baseUrl}${localePathPrefix(locale)}/changelog`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: t("detailSeoTitle", { version }),
    description: t("detailSeoDescription", {
      version,
      date: formatDate(release.pubDate, locale),
    }),
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    datePublished: release.pubDate.toISOString(),
    dateModified: release.updatedAt.toISOString(),
    mainEntityOfPage: pageUrl,
    url: pageUrl,
    author: { "@type": "Organization", name: siteConfig.brand, url: baseUrl },
    publisher: {
      "@type": "Organization",
      name: siteConfig.brand,
      url: baseUrl,
    },
    about: {
      "@type": "SoftwareApplication",
      name: "UniClipboard",
      softwareVersion: release.version,
      operatingSystem: "macOS, Windows, Linux, iOS, Android",
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
        item: parentUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `v${release.version}`,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <Navigation />
      <main>
        <section className="border-border bg-background border-b pt-28 pb-12 md:pt-36 md:pb-14">
          <div className="landing-shell" style={{ maxWidth: 880 }}>
            <BreadcrumbBar
              items={[
                { label: t("breadcrumbHome"), href: "/" },
                { label: t("breadcrumbCurrent"), href: "/changelog" },
                { label: `v${release.version}` },
              ]}
            />
            <AnimateIn variant="fade-in" duration={0.5}>
              <p className="landing-kicker">{t("eyebrow")}</p>
            </AnimateIn>
            <AnimateIn delay={0.05} duration={0.6}>
              <h1
                className="text-foreground mt-3.5 mb-4"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(2rem, 4.5vw, 3rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05,
                }}
              >
                v{release.version}
              </h1>
            </AnimateIn>
            <AnimateIn delay={0.1} duration={0.5}>
              <p
                className="text-muted2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  letterSpacing: "0.06em",
                }}
              >
                <span>{t("releasedOn")}</span>
                <span className="mx-1.5">·</span>
                <time dateTime={release.pubDate.toISOString()}>
                  {formatDate(release.pubDate, locale)}
                </time>
              </p>
            </AnimateIn>
            {summary.sections.length > 0 && (
              <AnimateIn delay={0.16} duration={0.5}>
                <SectionSummaryRow sections={summary.sections} />
              </AnimateIn>
            )}
          </div>
        </section>

        <section className="bg-background border-border border-b py-[56px] md:py-[80px]">
          <div className="landing-shell" style={{ maxWidth: 880 }}>
            <DownloadButtons
              entries={orderedPlatforms(release.platforms)}
              label={t("downloadLabel")}
            />
            <article
              className={`mt-10 ${changelogProseClasses}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </section>

        <section className="bg-bg2 py-12">
          <div className="landing-shell" style={{ maxWidth: 880 }}>
            <div className="grid gap-3 md:grid-cols-2">
              {older ? (
                <Link
                  href={`/changelog/${older.version}`}
                  className="border-border bg-background hover:bg-bg2 group flex flex-col gap-1 rounded-[14px] border p-5 transition-colors"
                >
                  <span
                    className="text-muted2 inline-flex items-center gap-1.5"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      letterSpacing: "0.06em",
                    }}
                  >
                    <ChevronLeft aria-hidden className="size-3" />
                    {t("olderRelease")}
                  </span>
                  <span
                    className="text-foreground"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    v{older.version}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {formatDate(older.pubDate, locale)}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {newer ? (
                <Link
                  href={`/changelog/${newer.version}`}
                  className="border-border bg-background hover:bg-bg2 group flex flex-col items-end gap-1 rounded-[14px] border p-5 text-right transition-colors"
                >
                  <span
                    className="text-muted2 inline-flex items-center gap-1.5"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {t("newerRelease")}
                    <ChevronRight aria-hidden className="size-3" />
                  </span>
                  <span
                    className="text-foreground"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    v{newer.version}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {formatDate(newer.pubDate, locale)}
                  </span>
                </Link>
              ) : (
                <span />
              )}
            </div>
            <div className="border-border mt-8 flex justify-center border-t pt-8">
              <Link
                href="/changelog"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
              >
                <ChevronLeft aria-hidden className="size-3.5" />
                {t("backToList")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <JsonLd data={[articleSchema, breadcrumbSchema]} />
    </>
  );
}
