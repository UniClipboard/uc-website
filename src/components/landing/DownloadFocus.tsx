"use client";

import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

type Item = {
  arch: string;
  ext: string;
  url: string;
};

type Group = {
  os: "mac" | "win" | "linux";
  label: string;
  items: Item[];
};

export type DownloadFocusProps = {
  groups: Group[];
  version: string;
  publishedAt: string;
  fallbackUrl: string;
  labels: {
    versionLabel: string;
    publishedLabel: string;
    channelLabel: string;
    channelStable: string;
    fallback: string;
    downloadAction: string;
    recommended: string;
    noDownloads: string;
  };
};

function GlyphMac({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.36 1.43c.07 1.4-.46 2.78-1.34 3.78-.93 1.07-2.45 1.9-3.94 1.78-.1-1.37.5-2.79 1.4-3.7.95-.99 2.55-1.74 3.88-1.86zM20.2 17.78c-.6 1.39-.89 2-1.66 3.22-1.07 1.7-2.58 3.81-4.45 3.83-1.66.02-2.09-1.08-4.34-1.07-2.25.01-2.72 1.09-4.39 1.07-1.87-.02-3.3-1.93-4.37-3.62C-1.97 16.55-2.28 9.3 1.05 6.34c1.5-1.34 3.2-2.13 4.81-2.13 1.66 0 2.69 1.06 4.07 1.06 1.34 0 2.16-1.06 4.07-1.06 1.45 0 2.99.79 4.08 2.13-3.59 1.97-3.01 7.1.12 8.44z" />
    </svg>
  );
}
function GlyphWin({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 4.5l8-1.1V11H3V4.5zm9-1.2l9-1.3V11h-9V3.3zM3 12h8v7.6L3 18.5V12zm9 0h9v9.5l-9-1.3V12z" />
    </svg>
  );
}
function GlyphLinux({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C9 2 8 4 8 7c0 .9 0 2-.5 3-.6 1-1.5 1.8-1.5 3 0 .8.4 1.5 1 2-.7.5-2 1.5-2 3 0 1.5 1 2 1 3 0 1.5-1 2-1 3h13c0-1-1-1.5-1-3 0-1 1-1.5 1-3 0-1.5-1.3-2.5-2-3 .6-.5 1-1.2 1-2 0-1.2-.9-2-1.5-3-.5-1-.5-2.1-.5-3 0-3-1-5-4-5z" />
    </svg>
  );
}

function Glyph({ os, size }: { os: Group["os"]; size?: number }) {
  if (os === "mac") return <GlyphMac size={size} />;
  if (os === "win") return <GlyphWin size={size} />;
  return <GlyphLinux size={size} />;
}

function detectOS(): Group["os"] {
  if (typeof navigator === "undefined") return "mac";
  const ua = (navigator.userAgent || "").toLowerCase();
  const plat = (navigator.platform || "").toLowerCase();
  if (/win/.test(plat) || /windows/.test(ua)) return "win";
  if (/linux/.test(plat) || /linux/.test(ua)) return "linux";
  return "mac";
}

export function DownloadFocus({
  groups,
  version,
  publishedAt,
  fallbackUrl,
  labels,
}: DownloadFocusProps) {
  const [primaryOS, setPrimaryOS] = useState<Group["os"]>("mac");
  const [activeTab, setActiveTab] = useState<Group["os"]>("mac");

  useEffect(() => {
    const os = detectOS();
    setPrimaryOS(os);
    setActiveTab(os);
  }, []);

  const activeGroup = groups.find((g) => g.os === activeTab) ?? groups[0];

  return (
    <div
      className="bg-card border-border rounded-[18px] border p-[22px]"
      style={{ boxShadow: "0 24px 60px -32px rgba(0,0,0,0.18)" }}
    >
      {/* Tabs */}
      <div
        role="tablist"
        className="bg-bg2 mb-[18px] flex gap-1 rounded-[12px] p-1"
        style={{ border: "1px solid var(--hair2)" }}
      >
        {groups.map((g) => {
          const isActive = activeTab === g.os;
          const isRecommended = g.os === primaryOS;
          return (
            <button
              key={g.os}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(g.os)}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[9px] px-3 py-2.5 transition-colors"
              style={{
                background: isActive ? "var(--card)" : "transparent",
                border: isActive
                  ? "1px solid var(--border)"
                  : "1px solid transparent",
                color: isActive ? "var(--foreground)" : "var(--muted)",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                letterSpacing: "-0.005em",
                boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
              }}
            >
              <Glyph os={g.os} size={14} />
              <span>{g.label}</span>
              {isRecommended && (
                <span
                  className="ml-0.5 rounded px-1.5 py-0.5"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: isActive ? "var(--muted)" : "var(--muted2)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    border: "1px solid var(--hair2)",
                    background: "var(--bg2)",
                  }}
                >
                  {labels.recommended}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2.5">
        {activeGroup.items.length === 0 ? (
          <div
            className="text-muted-foreground rounded-[12px] px-4 py-5 text-center"
            style={{ border: "1px dashed var(--border)" }}
          >
            {labels.noDownloads}
          </div>
        ) : (
          activeGroup.items.map((it, i) => {
            const isPrimary = i === 0;
            const fg = isPrimary ? "var(--background)" : "var(--foreground)";
            const bg = isPrimary ? "var(--foreground)" : "transparent";
            const border = isPrimary ? "var(--foreground)" : "var(--border)";
            const subFg = isPrimary ? "rgba(255,255,255,0.6)" : "var(--muted)";
            const tagBorder = isPrimary
              ? "rgba(255,255,255,0.18)"
              : "var(--hair2)";
            const iconBg = isPrimary ? "rgba(255,255,255,0.10)" : "var(--bg2)";
            return (
              <a
                key={`${it.arch}-${i}`}
                href={it.url}
                className="flex items-center gap-3.5 rounded-[12px] px-4 py-3.5 transition-transform hover:-translate-y-[1px]"
                style={{
                  background: bg,
                  color: fg,
                  border: `1px solid ${border}`,
                  textDecoration: "none",
                }}
              >
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-[9px]"
                  style={{
                    background: iconBg,
                    border: isPrimary ? "none" : "1px solid var(--hair2)",
                    color: fg,
                  }}
                >
                  <Glyph os={activeGroup.os} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.2,
                    }}
                  >
                    {labels.downloadAction} {it.arch}
                  </div>
                  <div
                    className="mt-1"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: subFg,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {activeGroup.label} · v{version}
                    <span
                      className="ml-2.5 rounded px-1.5 py-px"
                      style={{
                        border: `1px solid ${tagBorder}`,
                        fontSize: 10,
                      }}
                    >
                      {it.ext}
                    </span>
                  </div>
                </div>
                <div
                  className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-[8px]"
                  style={{
                    background: iconBg,
                    border: isPrimary ? "none" : "1px solid var(--hair2)",
                  }}
                >
                  <ArrowDown size={14} color={fg as string} />
                </div>
              </a>
            );
          })
        )}
      </div>

      {/* Footer link */}
      <div
        className="mt-[18px] flex items-center justify-between gap-4 pt-3.5"
        style={{ borderTop: "1px solid var(--hair2)" }}
      >
        <span
          className="text-muted2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {activeGroup.label} · {activeGroup.items.length}
        </span>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.04em",
          }}
        >
          {labels.fallback}
          <ArrowUpRight size={12} />
        </a>
      </div>

      {/* hidden published meta to satisfy unused param warning if needed */}
      <span aria-hidden className="sr-only">
        {labels.publishedLabel}: {publishedAt} · {labels.channelLabel}:{" "}
        {labels.channelStable}
      </span>
    </div>
  );
}
