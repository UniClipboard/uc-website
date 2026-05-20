"use client";

import { ArrowUpRight, Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type IosTestFlightLabels = {
  description: string;
  joinCta: string;
  joinHint: string;
  shareLabel: string;
  copy: string;
  copied: string;
};

type Props = {
  labels: IosTestFlightLabels;
  url: string;
};

export function IosTestFlightCta({ labels, url }: Props) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // copy may fail in privacy modes; silently degrade
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-muted-foreground"
        style={{ fontSize: 12.5, lineHeight: 1.55 }}
      >
        {labels.description}
      </p>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-foreground text-background inline-flex w-full items-center justify-between gap-3 rounded-[12px] px-4 py-3.5 transition-opacity hover:opacity-90 md:w-fit md:min-w-[320px]"
        style={{ letterSpacing: "-0.005em" }}
      >
        <span
          className="inline-flex items-center gap-2.5"
          style={{ fontSize: 14.5, fontWeight: 600 }}
        >
          <TestFlightGlyph />
          {labels.joinCta}
        </span>
        <ArrowUpRight size={16} strokeWidth={2} />
      </a>

      <div className="flex flex-col gap-2">
        <span
          className="text-muted2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {labels.shareLabel}
        </span>
        <div
          className="bg-bg2 flex items-center gap-2 rounded-[10px] px-3 py-2.5"
          style={{ border: "1px solid var(--hair2)" }}
        >
          <code
            className="text-foreground min-w-0 flex-1 overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch]"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12.5,
              lineHeight: 1.55,
              letterSpacing: "-0.005em",
            }}
          >
            {url}
          </code>
          <button
            type="button"
            onClick={onCopy}
            aria-label={copied ? labels.copied : labels.copy}
            title={copied ? labels.copied : labels.copy}
            className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[7px] transition-colors"
          >
            {copied ? (
              <Check size={14} className="text-emerald-500" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>
      </div>

      <p
        className="text-muted2"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.04em",
          lineHeight: 1.5,
        }}
      >
        {labels.joinHint}
      </p>
    </div>
  );
}

function TestFlightGlyph() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5 11 15.5 16 9.5" />
    </svg>
  );
}
