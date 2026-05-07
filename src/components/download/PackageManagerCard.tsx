import { ArrowUpRight } from "lucide-react";

import { CopyableCommand } from "./CopyableCommand";

export type PackageManagerCardProps = {
  os: "mac" | "linux";
  manager: string;
  title: string;
  subtitle: string;
  command: string;
  note?: string;
  docsLabel?: string;
  docsHref?: string;
  copyLabel: string;
  copiedLabel: string;
};

function GlyphMac() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GlyphLinux() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C9 2 8 4 8 7c0 .9 0 2-.5 3-.6 1-1.5 1.8-1.5 3 0 .8.4 1.5 1 2-.7.5-2 1.5-2 3 0 1.5 1 2 1 3 0 1.5-1 2-1 3h13c0-1-1-1.5-1-3 0-1 1-1.5 1-3 0-1.5-1.3-2.5-2-3 .6-.5 1-1.2 1-2 0-1.2-.9-2-1.5-3-.5-1-.5-2.1-.5-3 0-3-1-5-4-5z" />
    </svg>
  );
}

export function PackageManagerCard({
  os,
  manager,
  title,
  subtitle,
  command,
  note,
  docsLabel,
  docsHref,
  copyLabel,
  copiedLabel,
}: PackageManagerCardProps) {
  return (
    <div
      className="border-border bg-card flex h-full flex-col gap-4 rounded-[16px] border p-5 md:p-6"
      style={{ boxShadow: "0 16px 40px -28px rgba(0,0,0,0.16)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="bg-bg2 flex size-10 shrink-0 items-center justify-center rounded-[10px]"
          style={{ border: "1px solid var(--hair2)" }}
        >
          {os === "mac" ? <GlyphMac /> : <GlyphLinux />}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="text-foreground"
            style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          <div
            className="text-muted2 mt-0.5"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {manager}
          </div>
        </div>
      </div>

      <p
        className="text-muted-foreground flex-1"
        style={{ fontSize: 13.5, lineHeight: 1.55 }}
      >
        {subtitle}
      </p>

      <CopyableCommand
        command={command}
        copyLabel={copyLabel}
        copiedLabel={copiedLabel}
        layout="nowrap"
        prompt
      />

      {(note || docsHref) && (
        <div
          className="text-muted2 flex flex-wrap items-center justify-between gap-3 pt-1"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.04em",
          }}
        >
          {note ? <span>{note}</span> : <span aria-hidden />}
          {docsHref && docsLabel && (
            <a
              href={docsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              {docsLabel}
              <ArrowUpRight size={12} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
