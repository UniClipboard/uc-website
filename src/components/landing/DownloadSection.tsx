import { ArrowUpRight, Monitor } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { StableReleaseViewModel } from "@/lib/release-feed/normalize-release";

import { AnimateIn } from "./AnimateIn";
import { DownloadFocus } from "./DownloadFocus";
import { ShareLinkButton } from "./ShareLinkButton";

type DownloadSectionProps = {
  release: StableReleaseViewModel;
};

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

function fmtPublished(iso: string, unavailable: string): string {
  if (!iso || iso === "unavailable") return unavailable;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const m = months[d.getUTCMonth()];
    const day = d.getUTCDate();
    const yr = d.getUTCFullYear();
    const h = String(d.getUTCHours()).padStart(2, "0");
    const mn = String(d.getUTCMinutes()).padStart(2, "0");
    return `${m} ${day}, ${yr} · ${h}:${mn} UTC`;
  } catch {
    return iso;
  }
}

export async function DownloadSection({ release }: DownloadSectionProps) {
  const t = await getTranslations("landing.download");

  const unavailable = t("unavailableValue");
  const archLabels = {
    arm: t("archArm"),
    intel: t("archIntel"),
    x64: t("archX64"),
    appimage: t("archAppimage"),
  };
  const minOSLabels = {
    mac: t("minOSMac"),
    win: t("minOSWin"),
    linuxX64: t("minOSLinuxX64"),
    linuxArm: t("minOSLinuxArm"),
  };

  const groupedItems: Record<
    GroupOS,
    Array<{ arch: string; ext: string; url: string; minOS: string }>
  > = {
    mac: [],
    win: [],
    linux: [],
  };

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

  const groups = [
    { os: "mac" as const, label: t("platformMacOS"), items: groupedItems.mac },
    {
      os: "win" as const,
      label: t("platformWindows"),
      items: groupedItems.win,
    },
    {
      os: "linux" as const,
      label: t("platformLinux"),
      items: groupedItems.linux,
    },
  ];

  const versionLabel =
    release.version === "unavailable" ? unavailable : release.version;
  const publishedAtLabel = fmtPublished(release.publishedAt, unavailable);

  const isDegraded = release.status === "degraded";

  return (
    <section
      id="download"
      className="border-border bg-bg2 relative border-b py-[80px] md:py-[120px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 70% 50%, var(--border) 0%, transparent 70%)",
        }}
      />

      <div className="landing-shell relative">
        {/* Desktop / tablet */}
        <div className="hidden items-center gap-10 md:grid md:grid-cols-[1fr_1.1fr] md:gap-16">
          <div>
            <AnimateIn variant="fade-in" duration={0.5}>
              <p className="landing-kicker">{t("eyebrow")}</p>
            </AnimateIn>
            <AnimateIn delay={0.06} duration={0.6}>
              <h2
                className="text-foreground mt-3.5 mb-[22px]"
                style={{
                  fontSize: "clamp(2rem, 4.4vw, 3rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  textWrap: "balance",
                  lineHeight: 1.05,
                }}
              >
                {t("title")}
              </h2>
            </AnimateIn>
            <AnimateIn delay={0.12} duration={0.5}>
              <p
                className="text-muted-foreground mb-8"
                style={{ fontSize: 16, lineHeight: 1.6, maxWidth: 460 }}
              >
                {t("description")}
              </p>
            </AnimateIn>

            {isDegraded && (
              <AnimateIn delay={0.16} duration={0.5}>
                <p className="text-muted-foreground border-border bg-card mb-6 inline-flex rounded-full border px-3 py-1.5 text-sm font-medium">
                  {t("degradedNotice")}
                </p>
              </AnimateIn>
            )}

            <AnimateIn delay={0.18} duration={0.5}>
              <div
                className="text-muted-foreground flex flex-col gap-2.5"
                style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
              >
                <div className="flex gap-3.5">
                  <span
                    style={{
                      color: "var(--muted2)",
                      width: 96,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontSize: 10,
                    }}
                  >
                    {t("versionLabel")}
                  </span>
                  <span
                    className="inline-flex items-center gap-2"
                    style={{ color: "var(--ink2)" }}
                  >
                    v{versionLabel}
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{ color: "var(--muted)" }}
                    >
                      <span
                        className="inline-block"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 99,
                          background: "#3DA47A",
                          boxShadow: "0 0 0 3px rgba(61,164,122,0.18)",
                          animation: "uc-dot-pulse 2s ease-in-out infinite",
                        }}
                      />
                      {t("channelStable")}
                    </span>
                  </span>
                </div>
                <div className="flex gap-3.5">
                  <span
                    style={{
                      color: "var(--muted2)",
                      width: 96,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontSize: 10,
                    }}
                  >
                    {t("publishedLabel")}
                  </span>
                  <span style={{ color: "var(--ink2)" }}>
                    {publishedAtLabel}
                  </span>
                </div>
              </div>
            </AnimateIn>
          </div>

          <AnimateIn delay={0.14} duration={0.6}>
            <DownloadFocus
              groups={groups}
              version={versionLabel}
              fallbackUrl={release.fallbackReleaseUrl}
              labels={{
                fallback: t("fallback"),
                downloadAction: t("downloadAction"),
                recommended: t("recommended"),
                noDownloads: t("noDownloads"),
              }}
            />
          </AnimateIn>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <AnimateIn variant="fade-in" duration={0.5}>
            <p className="landing-kicker">{t("eyebrow")}</p>
          </AnimateIn>
          <AnimateIn delay={0.06} duration={0.6}>
            <h2
              className="text-foreground mt-3.5 mb-4"
              style={{
                fontSize: "clamp(1.75rem, 6vw, 2.25rem)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                textWrap: "balance",
              }}
            >
              {t("title")}
            </h2>
          </AnimateIn>
          <AnimateIn delay={0.1} duration={0.5}>
            <p
              className="text-muted-foreground mb-6"
              style={{ fontSize: 14.5, lineHeight: 1.6 }}
            >
              {t("descriptionMobile")}
            </p>
          </AnimateIn>

          {isDegraded && (
            <AnimateIn delay={0.14} duration={0.5}>
              <p className="text-muted-foreground border-border bg-card mb-5 inline-flex rounded-full border px-3 py-1.5 text-sm">
                {t("degradedNotice")}
              </p>
            </AnimateIn>
          )}

          <AnimateIn delay={0.16} duration={0.6}>
            <div className="border-border bg-card rounded-[14px] border px-5 py-7 text-center">
              <div className="bg-bg2 mx-auto mb-4 inline-flex size-11 items-center justify-center rounded-full">
                <Monitor
                  className="text-muted-foreground size-5"
                  strokeWidth={1.6}
                />
              </div>

              <div
                className="text-foreground inline-flex items-center gap-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "-0.005em",
                }}
              >
                v{versionLabel}
                <span
                  aria-hidden
                  className="inline-block size-1.5 rounded-full"
                  style={{
                    background: "#3DA47A",
                    boxShadow: "0 0 0 3px rgba(61,164,122,0.18)",
                    animation: "uc-dot-pulse 2s ease-in-out infinite",
                  }}
                />
                <span
                  className="text-muted2"
                  style={{ fontWeight: 500, letterSpacing: "0.04em" }}
                >
                  {t("channelStable")}
                </span>
              </div>

              <p
                className="text-muted-foreground mt-1"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.03em",
                }}
              >
                {publishedAtLabel}
              </p>

              <div className="mt-5 flex flex-col items-center gap-2.5">
                <a
                  href={release.fallbackReleaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground border-border bg-bg2 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 transition-colors"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {t("openRelease")}
                  <ArrowUpRight size={13} />
                </a>
                <ShareLinkButton
                  labels={{
                    idle: t("shareLinkIdle"),
                    copied: t("shareLinkCopied"),
                    shareTitle: t("shareLinkTitle"),
                  }}
                />
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
