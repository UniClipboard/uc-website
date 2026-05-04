"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  src: string;
  videoLabel: string;
  closeLabel: string;
};

export function HeroVideoModal({
  open,
  onClose,
  src,
  videoLabel,
  closeLabel,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const v = videoRef.current;
    if (v) {
      try {
        v.currentTime = 0;
      } catch {
        // ignore — some browsers throw before metadata loads
      }
      const playPromise = v.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Autoplay with sound may be blocked; user can press the native play control.
        });
      }
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (v) {
        v.pause();
      }
    };
  }, [open, onClose]);

  if (typeof window === "undefined") return null;

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
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="absolute -top-12 right-0 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:h-10 sm:w-10"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}
            >
              <X size={16} />
            </button>

            <div
              className="overflow-hidden rounded-[14px] bg-black sm:rounded-[20px]"
              style={{
                boxShadow:
                  "0 60px 120px -28px rgba(0,0,0,0.6), 0 24px 48px -22px rgba(0,0,0,0.4)",
              }}
            >
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                ref={videoRef}
                src={src}
                controls
                playsInline
                preload="auto"
                aria-label={videoLabel}
                className="block h-auto w-full"
                style={{ aspectRatio: "16 / 9" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
