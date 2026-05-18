"use client";

import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

import {
  IosBetaSignupForm,
  type IosBetaSignupLabels,
} from "./IosBetaSignupForm";
import { PlatformGlyph as Glyph } from "./PlatformGlyphs";

type Item = {
  arch: string;
  ext: string;
  url: string;
  minOS: string;
  recommended?: boolean;
  actionLabel?: string;
  disabled?: boolean;
  external?: boolean;
};

type Group = {
  os: "mac" | "win" | "linux" | "ios" | "android";
  label: string;
  items: Item[];
  betaLabel?: string;
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
  iosSignup?: {
    labels: IosBetaSignupLabels;
    locale?: string;
  };
};

function detectOS(): Group["os"] {
  if (typeof navigator === "undefined") return "mac";
  const ua = (navigator.userAgent || "").toLowerCase();
  const plat = (navigator.platform || "").toLowerCase();
  if (/iphone|ipad|ipod/.test(ua) || /iphone|ipad|ipod/.test(plat))
    return "ios";
  if (/android/.test(ua)) return "android";
  if (/win/.test(plat) || /windows/.test(ua)) return "win";
  if (/linux/.test(plat) || /linux/.test(ua)) return "linux";
  return "mac";
}

function allEqual(values: string[]): string | null {
  if (values.length === 0) return null;
  const first = values[0];
  return values.every((v) => v === first) ? first : null;
}

export function DownloadFocus({
  groups,
  version,
  fallbackUrl,
  labels,
  iosSignup,
}: DownloadFocusProps) {
  const [primaryOS, setPrimaryOS] = useState<Group["os"]>("mac");
  const [activeTab, setActiveTab] = useState<Group["os"]>("mac");

  useEffect(() => {
    const os = detectOS();
    const hasGroup = groups.some((g) => g.os === os);
    if (hasGroup) {
      setPrimaryOS(os);
      setActiveTab(os);
    } else {
      setPrimaryOS("mac");
      setActiveTab("mac");
    }
  }, [groups]);

  const activeGroup = groups.find((g) => g.os === activeTab) ?? groups[0];
  const isIosSignup = activeGroup.os === "ios" && Boolean(iosSignup);
  const maxItemCount = Math.max(...groups.map((g) => g.items.length), 1);
  const placeholderCount = Math.max(0, maxItemCount - activeGroup.items.length);

  const sharedMinOS = allEqual(
    activeGroup.items.map((it) => it.minOS).filter(Boolean),
  );
  const sharedExt = allEqual(
    activeGroup.items.map((it) => it.ext).filter(Boolean),
  );

  return (
    <div
      className="bg-card border-border rounded-[18px] border p-4 md:p-5"
      style={{ boxShadow: "0 24px 60px -32px rgba(0,0,0,0.18)" }}
    >
      {/* Platform tabs */}
      <div
        role="tablist"
        className="bg-bg2 mb-3.5 flex gap-0.5 rounded-[12px] p-0.5"
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
              className="relative inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] px-2 py-1.5 transition-colors md:px-2.5 md:py-2"
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
              <Glyph os={g.os} size={13} />
              <span className="truncate">{g.label}</span>
              {isRecommended && (
                <span
                  aria-label={labels.recommended}
                  className="inline-block size-1.5 shrink-0 rounded-full"
                  style={{
                    background: "#3DA47A",
                    boxShadow: "0 0 0 2px rgba(61,164,122,0.18)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Shared meta strip: version · minOS · ext (when shared) + optional beta */}
      {(() => {
        const showVersion = !isIosSignup;
        const showSharedMinOS = !isIosSignup && Boolean(sharedMinOS);
        const showSharedExt = !isIosSignup && Boolean(sharedExt);
        const hasAny =
          showVersion ||
          showSharedMinOS ||
          showSharedExt ||
          activeGroup.betaLabel;
        if (!hasAny) return null;
        return (
          <div
            className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: "0.04em",
            }}
          >
            {showVersion && (
              <span style={{ color: "var(--ink2)" }}>v{version}</span>
            )}
            {showSharedMinOS && (
              <>
                {showVersion && (
                  <span aria-hidden style={{ opacity: 0.4 }}>
                    ·
                  </span>
                )}
                <span>{sharedMinOS}</span>
              </>
            )}
            {showSharedExt && (
              <>
                {(showVersion || showSharedMinOS) && (
                  <span aria-hidden style={{ opacity: 0.4 }}>
                    ·
                  </span>
                )}
                <span>{sharedExt}</span>
              </>
            )}
            {activeGroup.betaLabel && (
              <span
                className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  border: "1px solid var(--hair2)",
                  background: "var(--bg2)",
                  color: "var(--muted)",
                }}
              >
                <span
                  aria-hidden
                  className="inline-block size-1.5 rounded-full"
                  style={{
                    background: "#E0A23A",
                    boxShadow: "0 0 0 2px rgba(224,162,58,0.18)",
                  }}
                />
                {activeGroup.betaLabel}
              </span>
            )}
          </div>
        );
      })()}

      {/* Rows */}
      <div className="flex flex-col gap-1">
        {isIosSignup ? (
          <IosBetaSignupForm
            labels={iosSignup!.labels}
            locale={iosSignup!.locale}
          />
        ) : activeGroup.items.length === 0 ? (
          <>
            <div
              className="text-muted-foreground rounded-[10px] px-4 py-5 text-center"
              style={{ border: "1px dashed var(--border)", fontSize: 13 }}
            >
              {labels.noDownloads}
            </div>
            {Array.from({ length: Math.max(0, maxItemCount - 1) }).map(
              (_, i) => (
                <div
                  key={`empty-placeholder-${i}`}
                  aria-hidden
                  className="min-h-[48px]"
                  style={{ visibility: "hidden" }}
                />
              ),
            )}
          </>
        ) : (
          activeGroup.items.map((it, i) => {
            const title = it.actionLabel ?? it.arch;
            const showRowMinOS = !sharedMinOS && Boolean(it.minOS);
            const showRowExt = !sharedExt && Boolean(it.ext);
            const isExternal = it.external ?? false;
            const isDisabled = it.disabled || !it.url;

            const rowClass =
              "group flex min-h-[48px] items-center gap-2.5 rounded-[10px] px-2.5 py-2 transition-colors";
            const interactiveClass = isDisabled
              ? "cursor-not-allowed opacity-55"
              : "hover:bg-bg2";

            const inner = (
              <>
                <span
                  aria-hidden
                  className="inline-block size-1.5 shrink-0 rounded-full"
                  style={{
                    background: it.recommended ? "#3DA47A" : "transparent",
                    boxShadow: it.recommended
                      ? "0 0 0 2px rgba(61,164,122,0.18)"
                      : "none",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-foreground truncate"
                    style={{
                      fontSize: 14.5,
                      fontWeight: it.recommended ? 600 : 500,
                      letterSpacing: "-0.005em",
                      lineHeight: 1.3,
                    }}
                  >
                    {title}
                  </div>
                  {(showRowMinOS || showRowExt) && (
                    <div
                      className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        color: "var(--muted)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {showRowMinOS && <span>{it.minOS}</span>}
                      {showRowMinOS && showRowExt && (
                        <span aria-hidden style={{ opacity: 0.4 }}>
                          ·
                        </span>
                      )}
                      {showRowExt && <span>{it.ext}</span>}
                    </div>
                  )}
                </div>
                <span
                  className="text-muted-foreground group-hover:text-foreground inline-flex shrink-0 items-center justify-center transition-colors"
                  aria-hidden
                >
                  {isExternal ? (
                    <ArrowUpRight size={15} strokeWidth={1.75} />
                  ) : (
                    <ArrowDown size={15} strokeWidth={1.75} />
                  )}
                </span>
              </>
            );

            if (isDisabled) {
              return (
                <div
                  key={`${it.arch}-${i}`}
                  aria-disabled
                  className={`${rowClass} ${interactiveClass}`}
                >
                  {inner}
                </div>
              );
            }

            return (
              <a
                key={`${it.arch}-${i}`}
                href={it.url}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className={`${rowClass} ${interactiveClass}`}
                style={{ textDecoration: "none" }}
              >
                {inner}
              </a>
            );
          })
        )}
        {activeGroup.items.length > 0 &&
          Array.from({ length: placeholderCount }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              aria-hidden
              className="min-h-[48px]"
              style={{ visibility: "hidden" }}
            />
          ))}
      </div>

      {/* Footer: fallback link only (hidden when iOS signup form is shown) */}
      {!isIosSignup && (
        <div
          className="mt-3.5 flex items-center justify-end pt-3"
          style={{ borderTop: "1px solid var(--hair2)" }}
        >
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
            <span>{labels.fallback}</span>
            <ArrowUpRight size={12} className="shrink-0" />
          </a>
        </div>
      )}
    </div>
  );
}
