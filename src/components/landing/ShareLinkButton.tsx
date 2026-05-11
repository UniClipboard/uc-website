"use client";

import { Check, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Labels = {
  idle: string;
  copied: string;
  shareTitle: string;
};

interface NavigatorWithShare {
  share?: (data: { title?: string; url?: string }) => Promise<void>;
}

export function ShareLinkButton({ labels }: { labels: Labels }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onClick = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.origin || "https://uniclipboard.app";
    const nav = window.navigator as NavigatorWithShare;
    if (typeof nav.share === "function") {
      try {
        await nav.share({ title: labels.shareTitle, url });
        return;
      } catch {
        // user cancelled or share failed — fall back to clipboard
      }
    }
    try {
      await window.navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — silently fail
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-foreground border-border bg-bg2 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 transition-colors"
      style={{
        fontSize: 12.5,
        fontWeight: 500,
        letterSpacing: "-0.005em",
      }}
    >
      {copied ? (
        <>
          <Check size={13} />
          {labels.copied}
        </>
      ) : (
        <>
          <Share2 size={13} />
          {labels.idle}
        </>
      )}
    </button>
  );
}
