"use client";

import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

import { CopyableCommand } from "@/components/download/CopyableCommand";
import {
  IosTestFlightCta,
  type IosTestFlightLabels,
} from "@/components/landing/IosTestFlightCta";
import { PlatformGlyph as Glyph } from "@/components/landing/PlatformGlyphs";

export type PlatformBlockItem = {
  arch: string;
  ext: string;
  url: string;
  minOS?: string;
  hint?: string;
  recommended?: boolean;
  external?: boolean;
};

export type PlatformBlock = {
  os: "mac" | "win" | "linux" | "ios" | "android";
  label: string;
  description: string;
  items: PlatformBlockItem[];
  betaLabel?: string;
  installCommand?: string;
  scriptSourceLabel?: string;
  scriptSourceUrl?: string;
};

export type PlatformBlocksLabels = {
  detected: string;
  downloadAction: string;
  noDownloads: string;
  copy: string;
  copied: string;
  fallback: string;
  versionPrefix: string;
};

export type PlatformBlocksProps = {
  blocks: PlatformBlock[];
  labels: PlatformBlocksLabels;
  version: string;
  fallbackUrl: string;
  iosTestFlight?: {
    labels: IosTestFlightLabels;
    url: string;
  };
};

function detectOS(): PlatformBlock["os"] | null {
  if (typeof navigator === "undefined") return null;
  const ua = (navigator.userAgent || "").toLowerCase();
  const plat = (navigator.platform || "").toLowerCase();
  if (/iphone|ipad|ipod/.test(ua) || /iphone|ipad|ipod/.test(plat))
    return "ios";
  if (/android/.test(ua)) return "android";
  if (/win/.test(plat) || /windows/.test(ua)) return "win";
  if (/linux/.test(plat) || /linux/.test(ua)) return "linux";
  if (/mac/.test(plat) || /mac os/.test(ua)) return "mac";
  return null;
}

const MOBILE_ONLY: PlatformBlock["os"][] = ["ios", "android"];

export function PlatformBlocks({
  blocks,
  labels,
  version,
  fallbackUrl,
  iosTestFlight,
}: PlatformBlocksProps) {
  const [active, setActive] = useState<PlatformBlock["os"]>(
    blocks[0]?.os ?? "mac",
  );
  const [detected, setDetected] = useState<PlatformBlock["os"] | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const os = detectOS();
    setDetected(os);

    const mq = window.matchMedia("(max-width: 767px)");
    const apply = (mobileVp: boolean) => {
      setIsMobileViewport(mobileVp);
      const candidates = mobileVp
        ? blocks.filter((b) => MOBILE_ONLY.includes(b.os))
        : blocks;
      if (candidates.length === 0) return;
      setActive((prev) => {
        if (candidates.some((b) => b.os === prev)) return prev;
        if (os && candidates.some((b) => b.os === os)) return os;
        return candidates[0].os;
      });
    };
    apply(mq.matches);
    const onChange = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [blocks]);

  const visibleBlocks = isMobileViewport
    ? blocks.filter((b) => MOBILE_ONLY.includes(b.os))
    : blocks;
  const activeBlock =
    visibleBlocks.find((b) => b.os === active) ?? visibleBlocks[0];
  if (!activeBlock) return null;

  return (
    <div
      className="border-border bg-card overflow-hidden rounded-[20px] border"
      style={{ boxShadow: "0 24px 60px -36px rgba(0,0,0,0.18)" }}
    >
      <div className="flex flex-col md:min-h-[480px] md:flex-row">
        <Sidebar
          blocks={visibleBlocks}
          active={active}
          detected={detected}
          onSelect={setActive}
          detectedLabel={labels.detected}
        />
        <div
          className="min-w-0 flex-1"
          role="tabpanel"
          aria-labelledby={`platform-tab-${activeBlock.os}`}
        >
          <Panel
            block={activeBlock}
            labels={labels}
            isDetected={detected === activeBlock.os}
            version={version}
            fallbackUrl={fallbackUrl}
            iosTestFlight={iosTestFlight}
          />
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  blocks,
  active,
  detected,
  onSelect,
  detectedLabel,
}: {
  blocks: PlatformBlock[];
  active: PlatformBlock["os"];
  detected: PlatformBlock["os"] | null;
  onSelect: (os: PlatformBlock["os"]) => void;
  detectedLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-orientation="vertical"
      className="border-border flex shrink-0 overflow-x-auto md:w-[268px] md:flex-col md:overflow-x-visible md:border-r md:py-5"
      style={{ borderColor: "var(--hair2)" }}
    >
      {blocks.map((b) => {
        const isActive = b.os === active;
        const isDetected = b.os === detected;
        return (
          <button
            key={b.os}
            id={`platform-tab-${b.os}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(b.os)}
            className="group/tab relative flex shrink-0 cursor-pointer items-center gap-3 px-6 py-3.5 text-left transition-colors hover:bg-[var(--bg2)]/50 md:py-3.5"
            style={{
              color: isActive ? "var(--foreground)" : "var(--muted)",
              background: isActive ? "var(--bg2)" : "transparent",
              fontSize: 14.5,
              fontWeight: isActive ? 600 : 500,
              letterSpacing: "-0.005em",
            }}
          >
            <span
              aria-hidden
              className="hidden md:block"
              style={{
                position: "absolute",
                left: 0,
                top: 10,
                bottom: 10,
                width: 3,
                borderRadius: 2,
                background: isActive ? "var(--foreground)" : "transparent",
                transition: "background 0.18s ease",
              }}
            />
            <Glyph os={b.os} size={16} />
            <span className="truncate">{b.label}</span>
            {isDetected && (
              <span
                aria-label={detectedLabel}
                title={detectedLabel}
                className="ml-auto inline-block size-1.5 shrink-0 rounded-full"
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
  );
}

function Panel({
  block,
  labels,
  isDetected,
  version,
  fallbackUrl,
  iosTestFlight,
}: {
  block: PlatformBlock;
  labels: PlatformBlocksLabels;
  isDetected: boolean;
  version: string;
  fallbackUrl: string;
  iosTestFlight?: PlatformBlocksProps["iosTestFlight"];
}) {
  return (
    <div className="flex h-full flex-col p-7 md:p-12">
      <header className="mb-7 md:mb-10">
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <h3
            className="text-foreground"
            style={{
              fontSize: "clamp(1.5rem, 2.8vw, 2rem)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}
          >
            {block.label}
          </h3>
          {block.betaLabel && (
            <span
              className="text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                border: "1px solid var(--hair2)",
                background: "var(--bg2)",
              }}
            >
              <span
                aria-hidden
                className="inline-block size-1.5 rounded-full"
                style={{
                  background: "#E0A23A",
                  boxShadow: "0 0 0 2px rgba(224,162,58,0.22)",
                }}
              />
              {block.betaLabel}
            </span>
          )}
          {isDetected && (
            <span
              className="text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                border: "1px solid var(--hair2)",
                background: "var(--bg2)",
              }}
            >
              <span
                aria-hidden
                className="inline-block size-1.5 rounded-full"
                style={{
                  background: "#3DA47A",
                  boxShadow: "0 0 0 2px rgba(61,164,122,0.22)",
                }}
              />
              {labels.detected}
            </span>
          )}
        </div>
        <p
          className="text-muted-foreground"
          style={{
            fontSize: 15.5,
            lineHeight: 1.6,
            maxWidth: 540,
          }}
        >
          {block.description}
        </p>
      </header>

      <div className="flex-1">
        {block.os === "ios" && iosTestFlight ? (
          <IosTestFlightCta
            labels={iosTestFlight.labels}
            url={iosTestFlight.url}
          />
        ) : block.os === "linux" ? (
          <LinuxBody block={block} labels={labels} />
        ) : block.items.length === 0 ? (
          <p
            className="text-muted-foreground rounded-[12px] px-4 py-6 text-center"
            style={{ border: "1px dashed var(--border)", fontSize: 13.5 }}
          >
            {labels.noDownloads}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {block.items.map((it, i) => (
              <ItemRow key={`${it.arch}-${i}`} item={it} />
            ))}
          </ul>
        )}
      </div>

      <footer
        className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-5 md:mt-10"
        style={{ borderTop: "1px solid var(--hair2)" }}
      >
        <span
          className="text-muted2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            letterSpacing: "0.04em",
          }}
        >
          {labels.versionPrefix} v{version}
        </span>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            letterSpacing: "0.04em",
          }}
        >
          <span>{labels.fallback}</span>
          <ArrowUpRight size={12} />
        </a>
      </footer>
    </div>
  );
}

function LinuxBody({
  block,
  labels,
}: {
  block: PlatformBlock;
  labels: PlatformBlocksLabels;
}) {
  return (
    <div className="flex flex-col gap-4">
      {block.installCommand && (
        <CopyableCommand
          command={block.installCommand}
          copyLabel={labels.copy}
          copiedLabel={labels.copied}
          layout="nowrap"
          prompt
        />
      )}

      {block.scriptSourceUrl && block.scriptSourceLabel && (
        <div
          className="text-muted-foreground"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            letterSpacing: "0.04em",
          }}
        >
          <a
            href={block.scriptSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <span>{block.scriptSourceLabel}</span>
            <ArrowUpRight size={12} />
          </a>
        </div>
      )}
    </div>
  );
}

function ItemRow({ item }: { item: PlatformBlockItem }) {
  const isExternal = item.external ?? false;

  return (
    <li>
      <a
        href={item.url}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="group hover:bg-bg2 flex items-center gap-3 rounded-[12px] px-4 py-3.5 transition-colors"
        style={{ textDecoration: "none" }}
      >
        <span
          aria-hidden
          className="inline-block size-1.5 shrink-0 rounded-full"
          style={{
            background: item.recommended ? "#3DA47A" : "transparent",
            border: item.recommended ? "none" : "1px solid var(--hair2)",
            boxShadow: item.recommended
              ? "0 0 0 2px rgba(61,164,122,0.18)"
              : "none",
          }}
        />
        <div className="min-w-0 flex-1">
          <div
            className="text-foreground truncate"
            style={{
              fontSize: 15.5,
              fontWeight: item.recommended ? 600 : 500,
              letterSpacing: "-0.005em",
              lineHeight: 1.35,
            }}
          >
            {item.arch}
          </div>
          {(item.hint || item.minOS || item.ext) && (
            <div
              className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5"
              style={{
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              {item.hint && <span>{item.hint}</span>}
              {!item.hint && item.minOS && <span>{item.minOS}</span>}
              {!item.hint && item.minOS && item.ext && (
                <span aria-hidden style={{ opacity: 0.4 }}>
                  ·
                </span>
              )}
              {!item.hint && item.ext && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11.5,
                    letterSpacing: "0.04em",
                  }}
                >
                  {item.ext}
                </span>
              )}
            </div>
          )}
        </div>
        <span
          className="text-muted-foreground group-hover:text-foreground inline-flex shrink-0 items-center justify-center transition-colors"
          aria-hidden
        >
          {isExternal ? (
            <ArrowUpRight size={16} strokeWidth={1.75} />
          ) : (
            <ArrowDown size={16} strokeWidth={1.75} />
          )}
        </span>
      </a>
    </li>
  );
}
