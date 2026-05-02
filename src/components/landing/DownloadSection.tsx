import { getTranslations } from "next-intl/server";

import type { StableReleaseViewModel } from "@/lib/release-feed/normalize-release";

import { AnimateIn } from "./AnimateIn";
import { DownloadFocus } from "./DownloadFocus";

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

  const groupedItems: Record<
    GroupOS,
    Array<{ arch: string; ext: string; url: string }>
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
      className="border-border bg-bg2 relative border-b py-[120px]"
    >
      {/* Soft radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 70% 50%, var(--border) 0%, transparent 70%)",
        }}
      />

      <div className="landing-shell relative">
        <div
          className="grid items-center gap-16"
          style={{ gridTemplateColumns: "1fr 1.1fr" }}
        >
          {/* Left: heading + meta */}
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
                  <span style={{ color: "var(--ink2)" }}>v{versionLabel}</span>
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
                    {t("channelLabel")}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{ color: "var(--ink2)" }}
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
                </div>
              </div>
            </AnimateIn>

            <AnimateIn delay={0.24} duration={0.5}>
              <p
                className="text-muted-foreground mt-6"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.04em",
                }}
              >
                {t("freshnessHint")}
              </p>
            </AnimateIn>
          </div>

          {/* Right: download focus card */}
          <AnimateIn delay={0.14} duration={0.6}>
            <DownloadFocus
              groups={groups}
              version={versionLabel}
              publishedAt={publishedAtLabel}
              fallbackUrl={release.fallbackReleaseUrl}
              labels={{
                versionLabel: t("versionLabel"),
                publishedLabel: t("publishedLabel"),
                channelLabel: t("channelLabel"),
                channelStable: t("channelStable"),
                fallback: t("fallback"),
                downloadAction: t("downloadAction"),
                recommended: t("recommended"),
                noDownloads: t("noDownloads"),
              }}
            />
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
