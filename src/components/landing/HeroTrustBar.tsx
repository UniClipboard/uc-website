import { Github, Lock, Sparkles } from "lucide-react";

import { formatStars } from "@/lib/github-stars";

type Props = {
  stars: number | null;
  labels: {
    starsSuffix: string;
    starsFallback: string;
    free: string;
    e2e: string;
  };
};

export function HeroTrustBar({ stars, labels }: Props) {
  return (
    <div
      className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.04em",
      }}
    >
      <a
        href="https://github.com/UniClipboard/UniClipboard"
        target="_blank"
        rel="noopener noreferrer"
        className="border-border bg-foreground/5 hover:bg-foreground/10 text-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors"
      >
        <Github className="size-[12px]" strokeWidth={1.6} />
        <span className="font-semibold">
          {stars !== null ? `${formatStars(stars)} ★` : labels.starsFallback}
        </span>
        <span className="text-muted2">{labels.starsSuffix}</span>
      </a>

      <span className="inline-flex items-center gap-1.5">
        <Sparkles className="size-[12px]" strokeWidth={1.6} />
        {labels.free}
      </span>

      <span className="text-muted2" aria-hidden>
        ·
      </span>

      <span className="inline-flex items-center gap-1.5">
        <Lock className="size-[12px]" strokeWidth={1.6} />
        {labels.e2e}
      </span>
    </div>
  );
}
