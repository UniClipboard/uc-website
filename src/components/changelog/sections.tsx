import { Apple, Download, Monitor, Terminal } from "lucide-react";

import { platformLabel } from "@/db/releases";
import {
  classifySectionTone,
  type ReleaseSection,
  type SectionTone,
} from "@/lib/changelog-parser";
import { cn } from "@/lib/utils";

export const changelogProseClasses = [
  "[&_h2]:mt-10",
  "[&_h2]:mb-4",
  "[&_h2]:text-[clamp(1.35rem,2.4vw,1.75rem)]",
  "[&_h2]:font-semibold",
  "[&_h2]:tracking-[-0.02em]",
  "[&_h2]:leading-[1.2]",
  "[&_h2]:text-foreground",
  "[&_h3]:mt-7",
  "[&_h3]:mb-3",
  "[&_h3]:text-[1rem]",
  "[&_h3]:font-semibold",
  "[&_h3]:tracking-[-0.005em]",
  "[&_h3]:text-foreground",
  "[&_p]:my-3",
  "[&_p]:text-[15px]",
  "[&_p]:leading-[1.65]",
  "[&_p]:text-foreground/85",
  "[&_a]:text-foreground",
  "[&_a]:underline",
  "[&_a]:underline-offset-4",
  "[&_a]:decoration-foreground/30",
  "hover:[&_a]:decoration-foreground",
  "[&_strong]:text-foreground",
  "[&_strong]:font-semibold",
  "[&_em]:italic",
  "[&_ul]:my-3",
  "[&_ul]:list-disc",
  "[&_ul]:pl-5",
  "[&_ul]:text-foreground/85",
  "[&_ol]:my-3",
  "[&_ol]:list-decimal",
  "[&_ol]:pl-5",
  "[&_ol]:text-foreground/85",
  "[&_li]:my-1",
  "[&_li]:leading-[1.6]",
  "[&_li]:text-[15px]",
  "[&_blockquote]:border-l-2",
  "[&_blockquote]:border-border",
  "[&_blockquote]:pl-4",
  "[&_blockquote]:my-4",
  "[&_blockquote]:text-muted-foreground",
  "[&_blockquote]:italic",
  "[&_code]:bg-bg2",
  "[&_code]:rounded",
  "[&_code]:px-1.5",
  "[&_code]:py-0.5",
  "[&_code]:font-mono",
  "[&_code]:text-[13px]",
  "[&_pre]:border",
  "[&_pre]:border-border",
  "[&_pre]:rounded-lg",
  "[&_pre]:p-4",
  "[&_pre]:my-4",
  "[&_pre]:overflow-x-auto",
  "[&_pre]:text-[13px]",
  "[&_pre]:leading-[1.6]",
  "[&_pre>code]:bg-transparent",
  "[&_pre>code]:p-0",
  "[&_hr]:my-6",
  "[&_hr]:border-border",
].join(" ");

const TONE_BADGE: Record<SectionTone, string> = {
  breaking:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  feature:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  fix: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  neutral: "border-border bg-bg2 text-muted-foreground",
};

export function SectionBadge({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  const tone = classifySectionTone(title);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        TONE_BADGE[tone],
      )}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.04em",
      }}
    >
      <span>{title}</span>
      {typeof count === "number" && count > 0 && (
        <span className="opacity-70">·{count}</span>
      )}
    </span>
  );
}

export function SectionSummaryRow({
  sections,
}: {
  sections: ReleaseSection[];
}) {
  if (sections.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {sections.map((section, i) => (
        <SectionBadge
          key={`${section.title}-${i}`}
          title={section.title}
          count={section.itemCount}
        />
      ))}
    </div>
  );
}

const PLATFORM_ICON: Record<string, typeof Apple> = {
  "darwin-aarch64": Apple,
  "darwin-x86_64": Apple,
  "windows-x86_64": Monitor,
  "linux-x86_64": Terminal,
};

export type DownloadEntry = { key: string; url: string };

export function DownloadButtons({
  entries,
  label,
}: {
  entries: DownloadEntry[];
  label: string;
}) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <p
        className="text-muted2"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {entries.map((entry) => {
          const Icon = PLATFORM_ICON[entry.key] ?? Download;
          return (
            <a
              key={entry.key}
              href={entry.url}
              className="border-border bg-background hover:bg-bg2 inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors"
              rel="noopener noreferrer"
            >
              <Icon aria-hidden className="size-3.5" />
              <span>{platformLabel(entry.key)}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
