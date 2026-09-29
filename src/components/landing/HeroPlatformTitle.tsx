"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { PlatformGlyph, type PlatformOS } from "./PlatformGlyphs";

const PLATFORMS: { os: PlatformOS; name: string }[] = [
  { os: "mac", name: "Mac" },
  { os: "win", name: "Windows" },
  { os: "linux", name: "Linux" },
  { os: "ios", name: "iPhone" },
  { os: "android", name: "Android" },
];

// Offset 3 over 5 platforms pairs every platform with a different one on each
// side: Mac→iPhone, Windows→Android, Linux→Mac, iPhone→Windows, Android→Linux.
const PASTE_OFFSET = 3;
const INTERVAL_MS = 2600;
const PASTE_DELAY_S = 0.16;
const EASE = [0.22, 1, 0.36, 1] as const;

// Isomorphic layout effect: measure before paint on the client, no-op on the
// server (the first pair renders at its natural width there).
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

type Props = {
  /** Message with a `{platform}` placeholder, e.g. "Copy on {platform}". */
  copyTemplate: string;
  pasteTemplate: string;
  /** Static sentence read by screen readers instead of the rotating text. */
  a11yLabel: string;
};

export function HeroPlatformTitle({
  copyTemplate,
  pasteTemplate,
  a11yLabel,
}: Props) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setIndex((i) => (i + 1) % PLATFORMS.length);
      }
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduce]);

  const copy = PLATFORMS[index];
  const paste = PLATFORMS[(index + PASTE_OFFSET) % PLATFORMS.length];

  return (
    <>
      <span className="sr-only">{a11yLabel}</span>
      <span aria-hidden className="block">
        <Line template={copyTemplate}>
          <Slot platform={copy} delay={0} />
        </Line>
        <Line template={pasteTemplate} muted>
          <Slot platform={paste} delay={PASTE_DELAY_S} />
        </Line>
      </span>
    </>
  );
}

function Line({
  template,
  muted,
  children,
}: {
  template: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  const [before = "", after = ""] = template.split("{platform}");
  return (
    <span
      className="block py-[0.06em]"
      style={muted ? { color: "var(--muted2)" } : undefined}
    >
      {before}
      {children}
      {after}
    </span>
  );
}

function Slot({
  platform,
  delay,
}: {
  platform: (typeof PLATFORMS)[number];
  delay: number;
}) {
  const measureRef = useRef<HTMLSpanElement>(null);
  const [widths, setWidths] = useState<Record<string, number> | null>(null);

  const measure = useCallback(() => {
    const root = measureRef.current;
    if (!root) return;
    const next: Record<string, number> = {};
    root.querySelectorAll<HTMLElement>("[data-os]").forEach((el) => {
      next[el.dataset.os as string] = el.getBoundingClientRect().width;
    });
    setWidths(next);
  }, []);

  useIsoLayoutEffect(() => {
    measure();
    // Web fonts and the clamp()-based font size both change word widths.
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <motion.span
      className="relative mx-[0.06em] inline-flex h-[1.1em] items-center justify-center overflow-hidden align-[0.05em] whitespace-nowrap"
      style={{ color: "var(--foreground)" }}
      initial={false}
      animate={widths ? { width: widths[platform.os] } : undefined}
      transition={{ duration: 0.45, ease: EASE, delay }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={platform.os}
          className="inline-flex items-center"
          initial={{ y: "70%", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-70%", opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: EASE, delay }}
        >
          <SlotContent platform={platform} />
        </motion.span>
      </AnimatePresence>

      {/* Invisible copies of every platform, used only to measure widths. */}
      <span
        ref={measureRef}
        className="pointer-events-none invisible absolute top-0 left-0"
      >
        {PLATFORMS.map((p) => (
          <span key={p.os} data-os={p.os} className="absolute inline-flex">
            <SlotContent platform={p} />
          </span>
        ))}
      </span>
    </motion.span>
  );
}

function SlotContent({ platform }: { platform: (typeof PLATFORMS)[number] }) {
  return (
    <span className="inline-flex items-center gap-[0.14em] px-[0.04em] [&_svg]:h-[0.62em] [&_svg]:w-[0.62em]">
      <PlatformGlyph os={platform.os} />
      {platform.name}
    </span>
  );
}
