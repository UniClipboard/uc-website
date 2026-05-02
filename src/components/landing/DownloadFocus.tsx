"use client";

import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

type Item = {
  arch: string;
  ext: string;
  url: string;
  minOS: string;
};

type Group = {
  os: "mac" | "win" | "linux";
  label: string;
  items: Item[];
};

export type DownloadFocusProps = {
  groups: Group[];
  version: string;
  fallbackUrl: string;
  labels: {
    fallback: string;
    downloadAction: string;
    recommended: string;
    noDownloads: string;
  };
};

function GlyphMac({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
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
  const maxItemCount = Math.max(...groups.map((g) => g.items.length), 1);
  const placeholderCount = Math.max(0, maxItemCount - activeGroup.items.length);

  return (
    <div
      className="bg-card border-border rounded-[18px] border p-[22px]"
      style={{ boxShadow: "0 24px 60px -32px rgba(0,0,0,0.18)" }}
    >
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

      <div className="flex flex-col gap-2.5">
        {activeGroup.items.length === 0 ? (
          <>
            <div
              className="text-muted-foreground rounded-[12px] px-4 py-5 text-center"
              style={{ border: "1px dashed var(--border)" }}
            >
              {labels.noDownloads}
            </div>
            {Array.from({ length: Math.max(0, maxItemCount - 1) }).map(
              (_, i) => (
                <div
                  key={`empty-placeholder-${i}`}
                  aria-hidden
                  className="flex items-center gap-3.5 rounded-[12px] px-4 py-3.5"
                  style={{
                    visibility: "hidden",
                    border: "1px solid transparent",
                  }}
                >
                  <div className="size-9 shrink-0 rounded-[9px]" />
                  <div className="min-w-0 flex-1">
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        lineHeight: 1.2,
                      }}
                    >
                      &nbsp;
                    </div>
                    <div
                      className="mt-1"
                      style={{ fontSize: 11, lineHeight: 1.4 }}
                    >
                      &nbsp;
                    </div>
                  </div>
                  <div className="size-[30px] shrink-0 rounded-[8px]" />
                </div>
              ),
            )}
          </>
        ) : (
          activeGroup.items.map((it, i) => {
            const isPrimary = i === 0;
            const fg = isPrimary ? "var(--background)" : "var(--foreground)";
            const bg = isPrimary ? "var(--foreground)" : "transparent";
            const border = isPrimary ? "var(--foreground)" : "var(--border)";
            const subFg = isPrimary
              ? "color-mix(in srgb, var(--background) 60%, transparent)"
              : "var(--muted)";
            const tagBorder = isPrimary
              ? "color-mix(in srgb, var(--background) 18%, transparent)"
              : "var(--hair2)";
            const iconBg = isPrimary
              ? "color-mix(in srgb, var(--background) 10%, transparent)"
              : "var(--bg2)";
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
                    className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: subFg,
                      letterSpacing: "0.04em",
                    }}
                  >
                    <span>v{version}</span>
                    {it.minOS && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{it.minOS}</span>
                      </>
                    )}
                    <span
                      className="rounded px-1.5 py-px"
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
        {activeGroup.items.length > 0 &&
          Array.from({ length: placeholderCount }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              aria-hidden
              className="flex items-center gap-3.5 rounded-[12px] px-4 py-3.5"
              style={{
                visibility: "hidden",
                border: "1px solid transparent",
              }}
            >
              <div className="size-9 shrink-0 rounded-[9px]" />
              <div className="min-w-0 flex-1">
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  &nbsp;
                </div>
                <div className="mt-1" style={{ fontSize: 11, lineHeight: 1.4 }}>
                  &nbsp;
                </div>
              </div>
              <div className="size-[30px] shrink-0 rounded-[8px]" />
            </div>
          ))}
      </div>

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
    </div>
  );
}
