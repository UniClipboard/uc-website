"use client";

import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { ItemKind } from "@/lib/web-transfer/payload";

/**
 * Object URLs for blobs, created in an effect so that React's effect replay
 * (strict mode, fast refresh) never leaves the page holding a revoked URL.
 */
export function useObjectUrls(blobs: readonly Blob[]): string[] {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const created = blobs.map((b) => URL.createObjectURL(b));
    setUrls(created);
    return () => created.forEach((u) => URL.revokeObjectURL(u));
  }, [blobs]);
  return urls;
}

const NO_BLOBS: Blob[] = [];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

export function Heading({ text, done }: { text: string; done?: boolean }) {
  return (
    <div className="try-heading">
      {done && (
        <span className="try-check" aria-hidden>
          <Check size={16} strokeWidth={2.4} />
        </span>
      )}
      <h1>{text}</h1>
    </div>
  );
}

export function ProgressBar({ fraction }: { fraction: number | null }) {
  const pct = fraction === null ? null : Math.round(fraction * 100);
  return (
    <div
      className="try-bar"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct ?? undefined}
      data-indeterminate={pct === null ? "" : undefined}
    >
      <span style={{ width: `${pct ?? 0}%` }} />
    </div>
  );
}

/** Circular progress; `fraction === null` spins. */
export function ProgressRing({ fraction }: { fraction: number | null }) {
  const r = 72;
  const c = 2 * Math.PI * r;
  const shown = fraction ?? 0.25;
  return (
    <svg
      className="try-ring"
      width="176"
      height="176"
      viewBox="0 0 176 176"
      aria-hidden
      data-indeterminate={fraction === null ? "" : undefined}
    >
      <circle
        cx="88"
        cy="88"
        r={r}
        fill="none"
        stroke="var(--try-line)"
        strokeWidth="6"
      />
      <g className="try-ring-arc">
        <circle
          cx="88"
          cy="88"
          r={r}
          fill="none"
          stroke="var(--try-accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(c * shown).toFixed(1)} ${c.toFixed(1)}`}
          transform="rotate(-90 88 88)"
          style={{ transition: "stroke-dasharray 160ms linear" }}
        />
      </g>
      {fraction !== null && (
        <text
          x="88"
          y="97"
          textAnchor="middle"
          fill="var(--try-fg)"
          style={{ font: "600 28px var(--try-font-sans), sans-serif" }}
        >
          {Math.round(fraction * 100)}%
        </text>
      )}
    </svg>
  );
}

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 && dot > name.length - 6 ? name.slice(dot + 1) : "file";
};

/** A thumbnail for images, or a file-type badge. */
export function ItemLead({
  kind,
  name,
  blob,
  large,
  alt = "",
}: {
  kind: ItemKind;
  name: string;
  blob?: Blob;
  large?: boolean;
  alt?: string;
}) {
  const blobs = useMemo(
    () => (kind === "image" && blob ? [blob] : NO_BLOBS),
    [kind, blob],
  );
  const url = useObjectUrls(blobs)[0];

  if (url) {
    return (
      // A local blob preview; next/image cannot optimise object URLs.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        className={large ? "try-thumb try-thumb--lg" : "try-thumb"}
      />
    );
  }
  return (
    <span
      className={cn("try-badge try-mono", large && "try-badge--lg")}
      aria-hidden
    >
      {extensionOf(name).slice(0, 4)}
    </span>
  );
}
