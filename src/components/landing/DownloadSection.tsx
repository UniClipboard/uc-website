import { Apple, ArrowUpRight, Download, Monitor, Terminal } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { StableReleaseViewModel } from "@/lib/release-feed/normalize-release";

import { AnimateIn } from "./AnimateIn";

type DownloadSectionProps = {
  release: StableReleaseViewModel;
};

type PlatformGroup = {
  id: string;
  icon: typeof Apple;
  entries: Array<{ platform: string; url: string; arch: string; ext: string }>;
};

function getFileExtension(url: string): string {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  return match ? `.${match[1]}` : "";
}

function getArchLabel(platform: string): string {
  if (platform.includes("ARM64")) return "Apple Silicon";
  if (platform.includes("x86_64") && platform.startsWith("macOS"))
    return "Intel";
  if (platform.includes("x86_64")) return "x64";
  if (platform.includes("arm64")) return "ARM64";
  return platform;
}

function groupDownloadsByPlatform(
  downloads: Array<{ platform: string; url: string }>,
): PlatformGroup[] {
  const groups: Record<
    string,
    Array<{ platform: string; url: string; arch: string; ext: string }>
  > = {
    macOS: [],
    Windows: [],
    Linux: [],
  };

  for (const entry of downloads) {
    const arch = getArchLabel(entry.platform);
    const ext = getFileExtension(entry.url);
    const enriched = { ...entry, arch, ext };

    if (entry.platform.startsWith("macOS")) {
      groups.macOS.push(enriched);
    } else if (entry.platform.startsWith("Windows")) {
      groups.Windows.push(enriched);
    } else if (entry.platform.startsWith("Linux")) {
      groups.Linux.push(enriched);
    }
  }

  return [
    { id: "macOS", icon: Apple, entries: groups.macOS },
    { id: "Windows", icon: Monitor, entries: groups.Windows },
    { id: "Linux", icon: Terminal, entries: groups.Linux },
  ];
}

const normalizeValue = (value: string, unavailableLabel: string) =>
  value === "unavailable" ? unavailableLabel : value;

export async function DownloadSection({ release }: DownloadSectionProps) {
  const t = await getTranslations("landing.download");
  const unavailableLabel = t("unavailableValue");

  const versionLabel = normalizeValue(release.version, unavailableLabel);
  const publishedAtLabel = normalizeValue(
    release.publishedAt,
    unavailableLabel,
  );

  const platformGroups = groupDownloadsByPlatform(release.downloads);
  const hasAnyDownloads = platformGroups.some(
    (group) => group.entries.length > 0,
  );
  const showInlineFallbackLink =
    release.status !== "degraded" || hasAnyDownloads;

  const platformNames: Record<string, string> = {
    macOS: t("platformMacOS"),
    Windows: t("platformWindows"),
    Linux: t("platformLinux"),
  };

  return (
    <section id="download" className="relative py-20 sm:py-28">
      <div className="landing-shell">
        <AnimateIn variant="scale-up">
          <div className="landing-panel rounded-[2rem] px-6 py-8 md:px-10 md:py-10">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
              <div className="max-w-[30rem]">
                <p className="landing-kicker">{t("sectionTitle")}</p>
                <h2 className="mt-5 text-[clamp(1.8rem,4.2vw,3.2rem)] leading-[0.96] font-semibold tracking-[-0.05em]">
                  {t("sectionTitle")}
                </h2>
                <p className="text-muted-foreground mt-4 max-w-md text-[0.94rem] leading-7">
                  {t("sectionDescription")}
                </p>
                {release.status === "degraded" ? (
                  <p className="border-border bg-accent/70 mt-5 inline-flex rounded-full border px-3 py-1.5 text-sm font-medium">
                    {t("degradedNotice")}
                  </p>
                ) : null}

                <div className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
                  <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-4">
                    <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                      {t("latestVersionLabel")}
                    </p>
                    <p className="text-foreground mt-2 text-lg font-medium">
                      {versionLabel}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-4">
                    <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                      {t("publishedAtLabel")}
                    </p>
                    <p className="text-foreground mt-2 text-lg font-medium">
                      {publishedAtLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  {showInlineFallbackLink ? (
                    <a
                      href={release.fallbackReleaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-primary inline-flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      {t("fallbackAction")}
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : null}
                  <p className="text-muted-foreground mt-3 text-xs leading-6">
                    {t("freshnessHint")}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklab,var(--color-muted)_45%,white)] dark:bg-[color:color-mix(in_oklab,var(--color-muted)_45%,black)]">
                {platformGroups.map((group, groupIndex) => {
                  const Icon = group.icon;

                  return (
                    <div
                      key={group.id}
                      className={
                        groupIndex === 0
                          ? ""
                          : "border-t border-[color:var(--border)]"
                      }
                    >
                      <div className="flex items-center gap-3 px-5 pt-5 pb-3 sm:px-7">
                        <div className="bg-card text-foreground flex h-10 w-10 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                          <Icon className="h-[18px] w-[18px]" />
                        </div>
                        <div>
                          <h3 className="text-foreground text-[15px] font-semibold">
                            {platformNames[group.id]}
                          </h3>
                          {group.entries.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                              {t("noDownloadsForPlatform")}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {group.entries.length > 0 ? (
                        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                          {group.entries.map((entry) => (
                            <a
                              key={`${entry.platform}-${entry.url}`}
                              href={entry.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center justify-between rounded-2xl border border-transparent px-3 py-3 transition-colors hover:border-[color:var(--border)] hover:bg-white/55 sm:px-4 dark:hover:bg-white/3"
                            >
                              <div className="flex min-w-0 items-center gap-4">
                                <div className="min-w-0">
                                  <p className="text-foreground text-sm font-medium">
                                    {entry.arch}
                                  </p>
                                  <p className="text-muted-foreground mt-0.5 text-xs">
                                    {entry.ext || entry.platform}
                                  </p>
                                </div>
                              </div>
                              <span className="border-border bg-card text-foreground group-hover:bg-primary group-hover:text-primary-foreground inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors">
                                <Download className="h-4 w-4" />
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {release.status === "degraded" && !hasAnyDownloads ? (
              <div className="mt-8 border-t border-[color:var(--border)] pt-6">
                <a
                  href={release.fallbackReleaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-primary-foreground inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium shadow-[0_18px_40px_rgba(38,106,74,0.22)] transition-all duration-300 ease-out hover:-translate-y-0.5"
                >
                  {t("fallbackAction")}
                </a>
              </div>
            ) : null}
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
