import { getTranslations } from "next-intl/server";

import type { StableReleaseViewModel } from "@/lib/release-feed/normalize-release";

type DownloadSectionProps = {
  release: StableReleaseViewModel;
};

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
  const notes = release.notes.map((note) =>
    note === "notes unavailable" ? t("notesUnavailable") : note,
  );

  return (
    <section id="download" className="mx-auto max-w-[1200px] px-6 py-20">
      <div className="border-border bg-background/70 rounded-3xl border p-8 shadow-sm md:p-12">
        <div className="mb-8">
          <h2 className="text-foreground text-3xl font-extrabold md:text-4xl">
            {t("sectionTitle")}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed md:text-lg">
            {t("sectionDescription")}
          </p>
          {release.status === "degraded" ? (
            <p className="text-foreground bg-accent mt-4 inline-flex rounded-lg px-3 py-2 text-sm font-semibold">
              {t("degradedNotice")}
            </p>
          ) : null}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-foreground text-sm font-bold tracking-wide uppercase">
              {t("latestVersionLabel")}
            </h3>
            <p className="text-foreground text-2xl font-bold">{versionLabel}</p>
            <p className="text-muted-foreground text-sm">
              {t("publishedAtLabel")}: {publishedAtLabel}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-foreground text-sm font-bold tracking-wide uppercase">
              {t("downloadsLabel")}
            </h3>
            {release.downloads.length > 0 ? (
              <ul className="space-y-2">
                {release.downloads.map((entry) => (
                  <li key={`${entry.platform}-${entry.url}`}>
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 text-sm font-semibold underline underline-offset-4"
                    >
                      {entry.platform}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                {t("notesUnavailable")}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href={release.fallbackReleaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-bold transition-all"
          >
            {t("fallbackAction")}
          </a>
          <p className="text-muted-foreground text-xs">{t("freshnessHint")}</p>
        </div>

        <div className="mt-8 space-y-2">
          <h3 className="text-foreground text-sm font-bold tracking-wide uppercase">
            {t("notesLabel")}
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            {notes.map((note) => (
              <li
                key={note}
                className="text-muted-foreground text-sm leading-relaxed"
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
