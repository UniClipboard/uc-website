import { ArrowDown, ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BreadcrumbBar, JsonLd } from "@/components/article/sections";
import { CopyableCommand } from "@/components/download/CopyableCommand";
import {
  type PlatformBlock,
  PlatformBlocks,
} from "@/components/download/PlatformBlocks";
import { AnimateIn } from "@/components/landing/AnimateIn";
import { Footer } from "@/components/landing/Footer";
import { Navigation } from "@/components/landing/Navigation";
import { Link } from "@/i18n/navigation";
import { buildMobileGroups, IOS_TESTFLIGHT_URL } from "@/lib/mobile-releases";
import {
  FALLBACK_RELEASE_URL,
  fetchStableRelease,
} from "@/lib/release-feed/fetch-stable-release";
import {
  normalizeStableRelease,
  type StableReleaseViewModel,
} from "@/lib/release-feed/normalize-release";
import { siteConfig } from "@/lib/site-config";

type LocaleParam = { params: Promise<{ locale: string }> };

const localePathPrefix = (locale: string) =>
  locale === "en" ? "" : `/${locale}`;

const buildDegradedFallback = (): StableReleaseViewModel => ({
  status: "degraded",
  version: "unavailable",
  publishedAt: "unavailable",
  notes: ["notes unavailable"],
  downloads: [],
  fallbackReleaseUrl: FALLBACK_RELEASE_URL,
  blockedPlatforms: [],
  degradedReason: "network-error",
});

type GroupOS = "mac" | "win" | "linux";

function getFileExtension(url: string): string {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  return match ? `.${match[1]}` : "";
}

function getOS(platform: string): GroupOS | null {
  if (platform.startsWith("macOS")) return "mac";
  if (platform.startsWith("Windows")) return "win";
  if (platform.startsWith("Linux")) return "linux";
  return null;
}

function getArchLabel(
  platform: string,
  archLabels: { arm: string; intel: string; x64: string; appimage: string },
): string {
  if (platform.includes("ARM64") && platform.startsWith("macOS"))
    return archLabels.arm;
  if (platform.includes("x86_64") && platform.startsWith("macOS"))
    return archLabels.intel;
  if (platform.startsWith("Linux") && platform.includes("AppImage"))
    return archLabels.appimage;
  if (platform.includes("x86_64") || platform.includes("x64"))
    return archLabels.x64;
  if (platform.includes("ARM64") || platform.includes("arm64")) return "ARM64";
  return platform;
}

function getMinOSLabel(
  platform: string,
  labels: { mac: string; win: string; linuxX64: string; linuxArm: string },
): string {
  if (platform.startsWith("macOS")) return labels.mac;
  if (platform.startsWith("Windows")) return labels.win;
  if (platform.startsWith("Linux") && platform.includes("ARM64"))
    return labels.linuxArm;
  if (platform.startsWith("Linux")) return labels.linuxX64;
  return "";
}

function fmtPublished(iso: string, locale: string, unavailable: string) {
  if (!iso || iso === "unavailable") return unavailable;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return iso;
  }
}

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: LocaleParam): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "downloadPage" });
  const canonical = `${localePathPrefix(locale)}/download`;
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
        en: "/download",
        zh: "/zh/download",
        "x-default": "/download",
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

type SysReqRow = {
  platform: string;
  minOS: string;
  arch: string;
  memory: string;
  disk: string;
};

type VerifyItem = {
  platform: string;
  body: string;
  command: string;
};

type FaqItem = { q: string; a: string };

export default async function DownloadPage({ params }: LocaleParam) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "downloadPage" });

  let release = buildDegradedFallback();
  try {
    release = normalizeStableRelease(await fetchStableRelease());
  } catch {
    release = buildDegradedFallback();
  }

  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const homePath = locale === "en" ? "/" : `/${locale}`;
  const canonical = `${localePathPrefix(locale)}/download`;
  const pageUrl = `${baseUrl}${canonical}`;

  const unavailable = t("hero.unavailableValue");
  const archLabels = {
    arm: t("direct.archArm"),
    intel: t("direct.archIntel"),
    x64: t("direct.archX64"),
    appimage: t("direct.archAppimage"),
  };
  const minOSLabels = {
    mac: t("direct.minOSMac"),
    win: t("direct.minOSWin"),
    linuxX64: t("direct.minOSLinuxX64"),
    linuxArm: t("direct.minOSLinuxArm"),
  };

  const groupedItems: Record<
    GroupOS,
    Array<{ arch: string; ext: string; url: string; minOS: string }>
  > = { mac: [], win: [], linux: [] };

  for (const entry of release.downloads) {
    const os = getOS(entry.platform);
    if (!os) continue;
    groupedItems[os].push({
      arch: getArchLabel(entry.platform, archLabels),
      ext: getFileExtension(entry.url),
      url: entry.url,
      minOS: getMinOSLabel(entry.platform, minOSLabels),
    });
  }

  const mobileGroups = buildMobileGroups({
    platformIOS: t("direct.platformIOS"),
    platformAndroid: t("direct.platformAndroid"),
    iosBetaBadge: t("direct.iosBetaBadge"),
    androidMinOS: t("direct.androidMinOS"),
    androidExtLabel: t("direct.androidExtLabel"),
    androidHintArm64: t("direct.androidHintArm64"),
    androidHintArmV7: t("direct.androidHintArmV7"),
    androidHintX64: t("direct.androidHintX64"),
    androidHintUniversal: t("direct.androidHintUniversal"),
  });

  const iosMobileGroup = mobileGroups.find((g) => g.os === "ios");
  const androidMobileGroup = mobileGroups.find((g) => g.os === "android");

  const platformBlocks: PlatformBlock[] = [
    {
      os: "mac",
      label: t("direct.platformMacOS"),
      description: t("direct.blockMacDescription"),
      items: groupedItems.mac,
    },
    {
      os: "win",
      label: t("direct.platformWindows"),
      description: t("direct.blockWinDescription"),
      items: groupedItems.win,
    },
    {
      os: "linux",
      label: t("direct.platformLinux"),
      description: t("direct.blockLinuxDescription"),
      items: groupedItems.linux.map((it) => ({ ...it, external: false })),
      installCommand: t("direct.linuxInstallCommand"),
      scriptSourceLabel: t("direct.linuxScriptSourceLabel"),
      scriptSourceUrl: t("direct.linuxScriptSourceUrl"),
    },
    {
      os: "android",
      label: t("direct.platformAndroid"),
      description: t("direct.blockAndroidDescription"),
      items: androidMobileGroup?.items ?? [],
    },
    {
      os: "ios",
      label: t("direct.platformIOS"),
      description: t("direct.blockIosDescription"),
      betaLabel: iosMobileGroup?.betaLabel,
      items: [],
    },
  ];

  const versionLabel =
    release.version === "unavailable" ? unavailable : release.version;
  const publishedAtLabel = fmtPublished(
    release.publishedAt,
    locale,
    unavailable,
  );
  const isDegraded = release.status === "degraded";

  const sysReqRows = t.raw("sysreq.rows") as SysReqRow[];
  const verifyItems = t.raw("verify.items") as VerifyItem[];
  const faqItems = t.raw("faq.items") as FaqItem[];

  const versionForSchema =
    release.version === "unavailable" ? undefined : release.version;
  const ogImage = `${baseUrl}${locale === "zh" ? "/og-zh.jpg" : "/og-en.jpg"}`;

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "UniClipboard",
    description: t("seoDescription"),
    applicationCategory: "ProductivityApplication",
    operatingSystem: "macOS, Windows, Linux, iOS, Android",
    url: pageUrl,
    image: ogImage,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    softwareVersion: versionForSchema,
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
    downloadUrl: release.fallbackReleaseUrl,
    sameAs: ["https://github.com/UniClipboard/UniClipboard"],
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <Navigation />
      <main>
        {/* Hero */}
        <section className="border-border bg-background border-b pt-24 pb-12 md:pt-36 md:pb-20">
          <div className="landing-shell">
            <BreadcrumbBar
              items={[
                { label: t("breadcrumbHome"), href: "/" },
                { label: t("breadcrumbCurrent") },
              ]}
            />
            <AnimateIn variant="fade-in" duration={0.5}>
              <p className="landing-kicker">{t("hero.eyebrow")}</p>
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
                {t("hero.title")}
              </h1>
            </AnimateIn>
            <AnimateIn delay={0.1} duration={0.5}>
              <p
                className="text-muted-foreground text-[15.5px] leading-[1.55] md:text-[18px]"
                style={{ maxWidth: 720 }}
              >
                {t("hero.subtitle")}
              </p>
            </AnimateIn>

            <AnimateIn delay={0.18} duration={0.5}>
              <div className="border-border bg-bg2/50 mt-7 flex flex-col gap-4 rounded-[14px] border p-5 md:mt-9 md:flex-row md:items-center md:justify-between md:gap-5 md:p-7">
                <div className="flex flex-col gap-2.5">
                  <span
                    className="text-muted2"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {t("hero.versionLabel")}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span
                      className="text-foreground"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "clamp(1.5rem, 3.2vw, 2rem)",
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      v{versionLabel}
                    </span>
                    <span
                      className="text-muted2 inline-flex items-center gap-1.5"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        letterSpacing: "0.05em",
                      }}
                    >
                      <span
                        className="inline-block size-1.5 rounded-full"
                        style={{
                          background: "#3DA47A",
                          boxShadow: "0 0 0 3px rgba(61,164,122,0.18)",
                          animation: "uc-dot-pulse 2s ease-in-out infinite",
                        }}
                      />
                      {t("hero.stableTag")}
                    </span>
                    <span
                      className="text-muted-foreground"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {t("hero.publishedLabel")} · {publishedAtLabel}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1.5 text-[12px]">
                    <span className="border-border inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                      <Check className="size-3" />
                      {t("hero.badgeFree")}
                    </span>
                    <span className="border-border inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                      <ShieldCheck className="size-3" />
                      {t("hero.badgeEncrypted")}
                    </span>
                    <span className="border-border inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                      {t("hero.badgeSignedMac")}
                    </span>
                    <span className="border-border inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                      {t("hero.badgeSignedWin")}
                    </span>
                  </div>
                </div>

                <a
                  href={release.fallbackReleaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground border-border bg-card hover:bg-foreground/5 inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 transition-colors"
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  {t("hero.openLatest")}
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* Direct downloads */}
        <section
          id="direct"
          className="border-border bg-bg2 border-b py-14 md:py-[100px]"
        >
          <div className="landing-shell">
            <div className="mb-8 max-w-[680px] md:mb-10">
              <AnimateIn variant="fade-in" duration={0.5}>
                <p className="landing-kicker">{t("direct.eyebrow")}</p>
              </AnimateIn>
              <AnimateIn delay={0.06} duration={0.6}>
                <h2
                  className="text-foreground mt-3.5 mb-4"
                  style={{
                    fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.1,
                    textWrap: "balance",
                  }}
                >
                  {t("direct.title")}
                </h2>
              </AnimateIn>
              <AnimateIn delay={0.1} duration={0.5}>
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 15.5, lineHeight: 1.6 }}
                >
                  {t("direct.description")}
                </p>
              </AnimateIn>
              {isDegraded && (
                <AnimateIn delay={0.16} duration={0.5}>
                  <p className="text-muted-foreground border-border bg-card mt-5 inline-flex rounded-full border px-3 py-1.5 text-sm">
                    {t("direct.degradedNotice")}
                  </p>
                </AnimateIn>
              )}
            </div>
            <AnimateIn delay={0.14} duration={0.55}>
              <PlatformBlocks
                blocks={platformBlocks}
                version={versionLabel}
                fallbackUrl={release.fallbackReleaseUrl}
                labels={{
                  detected: t("direct.detectedBadge"),
                  downloadAction: t("direct.downloadAction"),
                  noDownloads: t("direct.noDownloads"),
                  copy: t("pkg.copy"),
                  copied: t("pkg.copied"),
                  fallback: t("direct.fallback"),
                  versionPrefix: t("hero.versionLabel"),
                }}
                iosTestFlight={{
                  labels: {
                    description: t("direct.iosTestFlight.description"),
                    joinCta: t("direct.iosTestFlight.joinCta"),
                    joinHint: t("direct.iosTestFlight.joinHint"),
                    shareLabel: t("direct.iosTestFlight.shareLabel"),
                    copy: t("direct.iosTestFlight.copy"),
                    copied: t("direct.iosTestFlight.copied"),
                  },
                  url: IOS_TESTFLIGHT_URL,
                }}
              />
            </AnimateIn>
          </div>
        </section>

        {/* System requirements */}
        <section
          id="system-requirements"
          className="border-border bg-background border-b py-14 md:py-[100px]"
        >
          <div className="landing-shell">
            <div className="mb-8 max-w-[680px] md:mb-10">
              <AnimateIn variant="fade-in" duration={0.5}>
                <p className="landing-kicker">{t("sysreq.eyebrow")}</p>
              </AnimateIn>
              <AnimateIn delay={0.06} duration={0.6}>
                <h2
                  className="text-foreground mt-3.5 mb-4"
                  style={{
                    fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.1,
                    textWrap: "balance",
                  }}
                >
                  {t("sysreq.title")}
                </h2>
              </AnimateIn>
              <AnimateIn delay={0.1} duration={0.5}>
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 15.5, lineHeight: 1.6 }}
                >
                  {t("sysreq.description")}
                </p>
              </AnimateIn>
            </div>
            <AnimateIn delay={0.14} duration={0.55}>
              <div className="border-border bg-card overflow-hidden rounded-[14px] border">
                {/* Desktop table */}
                <div className="hidden md:block">
                  <table className="w-full table-fixed border-collapse text-left">
                    <thead>
                      <tr
                        className="text-muted2"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        <th className="border-border w-[140px] border-b px-5 py-4 font-medium">
                          {t("sysreq.colPlatform")}
                        </th>
                        <th className="border-border border-b px-5 py-4 font-medium">
                          {t("sysreq.colMinOS")}
                        </th>
                        <th className="border-border border-b px-5 py-4 font-medium">
                          {t("sysreq.colArch")}
                        </th>
                        <th className="border-border w-[140px] border-b px-5 py-4 font-medium">
                          {t("sysreq.colMemory")}
                        </th>
                        <th className="border-border w-[110px] border-b px-5 py-4 font-medium">
                          {t("sysreq.colDisk")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sysReqRows.map((row, i) => (
                        <tr
                          key={row.platform}
                          className={
                            i < sysReqRows.length - 1
                              ? "border-border border-b"
                              : ""
                          }
                        >
                          <td
                            className="text-foreground px-5 py-4 align-top"
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 13,
                              fontWeight: 600,
                              letterSpacing: "-0.005em",
                            }}
                          >
                            {row.platform}
                          </td>
                          <td className="text-foreground px-5 py-4 align-top text-[13.5px]">
                            {row.minOS}
                          </td>
                          <td className="text-muted-foreground px-5 py-4 align-top text-[13px]">
                            {row.arch}
                          </td>
                          <td
                            className="text-muted-foreground px-5 py-4 align-top"
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              letterSpacing: "0.02em",
                            }}
                          >
                            {row.memory}
                          </td>
                          <td
                            className="text-muted-foreground px-5 py-4 align-top"
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              letterSpacing: "0.02em",
                            }}
                          >
                            {row.disk}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="divide-border divide-y md:hidden">
                  {sysReqRows.map((row) => (
                    <div key={row.platform} className="px-4 py-4">
                      <div
                        className="text-foreground"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 14,
                          fontWeight: 600,
                          letterSpacing: "-0.005em",
                        }}
                      >
                        {row.platform}
                      </div>
                      <dl className="mt-3 space-y-2.5 text-[13px]">
                        <div className="flex flex-col gap-0.5">
                          <dt
                            className="text-muted2"
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 10.5,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                            }}
                          >
                            {t("sysreq.colMinOS")}
                          </dt>
                          <dd className="text-foreground">{row.minOS}</dd>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <dt
                            className="text-muted2"
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 10.5,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                            }}
                          >
                            {t("sysreq.colArch")}
                          </dt>
                          <dd className="text-muted-foreground">{row.arch}</dd>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-0.5">
                            <dt
                              className="text-muted2"
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 10.5,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                              }}
                            >
                              {t("sysreq.colMemory")}
                            </dt>
                            <dd
                              className="text-muted-foreground"
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 12,
                              }}
                            >
                              {row.memory}
                            </dd>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <dt
                              className="text-muted2"
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 10.5,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                              }}
                            >
                              {t("sysreq.colDisk")}
                            </dt>
                            <dd
                              className="text-muted-foreground"
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 12,
                              }}
                            >
                              {row.disk}
                            </dd>
                          </div>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* Verify */}
        <section
          id="verify"
          className="border-border bg-bg2 border-b py-14 md:py-[100px]"
        >
          <div className="landing-shell">
            <div className="mb-8 max-w-[680px] md:mb-10">
              <AnimateIn variant="fade-in" duration={0.5}>
                <p className="landing-kicker">{t("verify.eyebrow")}</p>
              </AnimateIn>
              <AnimateIn delay={0.06} duration={0.6}>
                <h2
                  className="text-foreground mt-3.5 mb-4"
                  style={{
                    fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.1,
                    textWrap: "balance",
                  }}
                >
                  {t("verify.title")}
                </h2>
              </AnimateIn>
              <AnimateIn delay={0.1} duration={0.5}>
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 15.5, lineHeight: 1.6 }}
                >
                  {t("verify.description")}
                </p>
              </AnimateIn>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
              {verifyItems.map((item, i) => (
                <AnimateIn
                  key={item.platform}
                  delay={0.12 + i * 0.06}
                  duration={0.55}
                  className="h-full"
                >
                  <div className="border-border bg-card flex h-full flex-col rounded-[14px] border p-4 md:p-6">
                    <div
                      className="text-muted2"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.platform}
                    </div>
                    <p
                      className="text-foreground mt-3 flex-1"
                      style={{
                        fontSize: 14.5,
                        lineHeight: 1.55,
                      }}
                    >
                      {item.body}
                    </p>
                    <div className="mt-4">
                      <CopyableCommand
                        command={item.command}
                        copyLabel={t("pkg.copy")}
                        copiedLabel={t("pkg.copied")}
                        layout="wrap"
                      />
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* Older versions */}
        <section
          id="older"
          className="border-border bg-background border-b py-12 md:py-[88px]"
        >
          <div className="landing-shell">
            <div className="border-border bg-card flex flex-col gap-4 rounded-[14px] border p-5 md:flex-row md:items-center md:justify-between md:gap-5 md:p-8">
              <div className="max-w-[520px]">
                <p className="landing-kicker">{t("older.eyebrow")}</p>
                <h2
                  className="text-foreground mt-3 mb-3"
                  style={{
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                  }}
                >
                  {t("older.title")}
                </h2>
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 14.5, lineHeight: 1.6 }}
                >
                  {t("older.description")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  href="/changelog"
                  className="text-foreground border-border bg-bg2 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 transition-colors"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {t("older.changelogCta")}
                  <ArrowDown size={13} className="-rotate-90" />
                </Link>
                <a
                  href={release.fallbackReleaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground border-border bg-bg2 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 transition-colors"
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  {t("older.allReleasesCta")}
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-bg2 py-14 md:py-[100px]">
          <div className="landing-shell">
            <div className="mb-8 max-w-[680px] md:mb-10">
              <AnimateIn variant="fade-in" duration={0.5}>
                <p className="landing-kicker">{t("faq.eyebrow")}</p>
              </AnimateIn>
              <AnimateIn delay={0.06} duration={0.6}>
                <h2
                  className="text-foreground mt-3.5 mb-2"
                  style={{
                    fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.1,
                  }}
                >
                  {t("faq.title")}
                </h2>
              </AnimateIn>
            </div>
            <div className="border-border divide-border divide-y rounded-[14px] border">
              {faqItems.map((item, i) => (
                <details
                  key={i}
                  className="group bg-card open:bg-bg2/40 px-4 py-4 first:rounded-t-[14px] last:rounded-b-[14px] md:px-7 md:py-5"
                >
                  <summary
                    className="text-foreground flex cursor-pointer list-none items-start justify-between gap-3 text-[14.5px] md:gap-4 md:text-[15.5px]"
                    style={{
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <span>{item.q}</span>
                    <span
                      aria-hidden
                      className="text-muted2 mt-0.5 shrink-0 transition-transform group-open:rotate-45 md:mt-1"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-muted-foreground mt-3 text-[13.5px] leading-[1.65] md:text-[14.5px]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <JsonLd data={[softwareSchema, breadcrumbSchema, faqSchema]} />
    </>
  );
}
