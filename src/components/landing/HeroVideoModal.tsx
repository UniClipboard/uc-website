"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type HeroVideoSource = "youtube" | "bilibili";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultSource: HeroVideoSource;
  mp4Src: string;
  videoLabel: string;
  closeLabel: string;
  youtubeLabel: string;
  bilibiliLabel: string;
  fallbackHint: string;
};

const YOUTUBE_ID = process.env.NEXT_PUBLIC_YOUTUBE_ID ?? "";
const BILIBILI_BVID = process.env.NEXT_PUBLIC_BILIBILI_BVID ?? "";
const STORAGE_KEY = "uc-hero-video-source";
// If the iframe HTML never reaches `load` within this window we assume the
// player is blocked (GFW, corporate proxy, deleted video) and degrade to mp4.
const LOAD_TIMEOUT_MS = 6000;

function buildEmbedUrl(source: HeroVideoSource) {
  if (source === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0&modestbranding=1`;
  }
  return `https://player.bilibili.com/player.html?bvid=${BILIBILI_BVID}&autoplay=1&high_quality=1&danmaku=0`;
}

export function HeroVideoModal({
  open,
  onClose,
  defaultSource,
  mp4Src,
  videoLabel,
  closeLabel,
  youtubeLabel,
  bilibiliLabel,
  fallbackHint,
}: Props) {
  const [source, setSource] = useState<HeroVideoSource>(defaultSource);
  const [usedFallback, setUsedFallback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "youtube" || stored === "bilibili") {
      setSource(stored);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setUsedFallback(false);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (usedFallback) return;

    timerRef.current = window.setTimeout(() => {
      setUsedFallback(true);
    }, LOAD_TIMEOUT_MS);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open, source, usedFallback]);

  useEffect(() => {
    if (!open || !usedFallback) return;
    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = 0;
    } catch {
      // ignore — some browsers throw before metadata loads
    }
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
    return () => v.pause();
  }, [open, usedFallback]);

  const handleIframeLoad = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const switchSource = (next: HeroVideoSource) => {
    if (next === source && !usedFallback) return;
    setUsedFallback(false);
    setSource(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore — storage may be disabled
    }
  };

  if (typeof window === "undefined") return null;

  const tabBase =
    "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors";
  const tabActive = "bg-white text-black";
  const tabIdle = "text-white/80 hover:text-white";

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={videoLabel}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-[1080px]"
          >
            <div className="absolute -top-12 right-0 left-0 flex items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label={videoLabel}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 p-1 backdrop-blur-md"
                style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={source === "youtube" && !usedFallback}
                  onClick={() => switchSource("youtube")}
                  className={`${tabBase} ${source === "youtube" && !usedFallback ? tabActive : tabIdle}`}
                >
                  {youtubeLabel}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={source === "bilibili" && !usedFallback}
                  onClick={() => switchSource("bilibili")}
                  className={`${tabBase} ${source === "bilibili" && !usedFallback ? tabActive : tabIdle}`}
                >
                  {bilibiliLabel}
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:h-10 sm:w-10"
                style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              className="overflow-hidden rounded-[14px] bg-black sm:rounded-[20px]"
              style={{
                boxShadow:
                  "0 60px 120px -28px rgba(0,0,0,0.6), 0 24px 48px -22px rgba(0,0,0,0.4)",
              }}
            >
              {usedFallback ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  ref={videoRef}
                  src={mp4Src}
                  controls
                  playsInline
                  preload="auto"
                  aria-label={videoLabel}
                  className="block h-auto w-full"
                  style={{ aspectRatio: "16 / 9" }}
                />
              ) : (
                <iframe
                  key={source}
                  src={buildEmbedUrl(source)}
                  title={videoLabel}
                  onLoad={handleIframeLoad}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="block h-auto w-full border-0"
                  style={{ aspectRatio: "16 / 9" }}
                />
              )}
            </div>

            {usedFallback && (
              <p className="mt-3 text-center text-xs text-white/70">
                {fallbackHint}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
