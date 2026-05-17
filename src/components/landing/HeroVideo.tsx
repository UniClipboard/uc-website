"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { HeroVideoModal, type HeroVideoSource } from "./HeroVideoModal";

type HeroVideoProps = {
  playLabel: string;
  videoLabel: string;
  openLabel: string;
  closeLabel: string;
  youtubeLabel: string;
  bilibiliLabel: string;
  fallbackHint: string;
  defaultSource: HeroVideoSource;
};

const VIDEO_SRC = "/video/demo.mp4";
const POSTER_SRC = "/video/demo-poster.jpg";

export function HeroVideo({
  playLabel,
  videoLabel,
  openLabel,
  closeLabel,
  youtubeLabel,
  bilibiliLabel,
  fallbackHint,
  defaultSource,
}: HeroVideoProps) {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);

  const openModal = () => setOpen(true);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative w-full"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10"
        style={{
          inset: "-14% -10% -22% -10%",
          background:
            "radial-gradient(55% 50% at 50% 45%, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0.05) 40%, rgba(99,102,241,0) 75%)",
          filter: "blur(28px)",
          opacity: hover ? 1 : 0.7,
          transition: "opacity .5s ease",
        }}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label={openLabel}
        onClick={openModal}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openModal();
          }
        }}
        className="relative w-full cursor-pointer overflow-hidden rounded-[20px] bg-[#0A0A0A] transition-all duration-500"
        style={{
          aspectRatio: "16 / 9",
          boxShadow: hover
            ? "0 60px 120px -28px rgba(10,10,10,0.34), 0 24px 48px -22px rgba(10,10,10,0.20), 0 0 0 1px rgba(10,10,10,0.10)"
            : "0 40px 90px -30px rgba(10,10,10,0.22), 0 16px 32px -16px rgba(10,10,10,0.12), 0 0 0 1px rgba(10,10,10,0.07)",
          transform: hover ? "translateY(-3px)" : "translateY(0)",
        }}
      >
        <Image
          src={POSTER_SRC}
          alt=""
          aria-hidden
          fill
          priority
          fetchPriority="high"
          sizes="(min-width: 1080px) 1080px, (min-width: 768px) 90vw, 100vw"
          className="object-cover"
        />

        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(60% 70% at 50% 50%, rgba(0,0,0,0.18), rgba(0,0,0,0.32))",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal();
            }}
            aria-label={openLabel}
            className="pointer-events-auto inline-flex cursor-pointer items-center gap-2.5 rounded-full pr-5 pl-4 transition-transform duration-300"
            style={{
              height: 48,
              background: "rgba(255,255,255,0.96)",
              color: "#0A0A0A",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "-0.005em",
              boxShadow:
                "0 14px 36px -8px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.6) inset",
              backdropFilter: "blur(8px)",
              transform: hover ? "scale(1.04)" : "scale(1)",
            }}
          >
            <span
              className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full"
              style={{ background: "#0A0A0A" }}
            >
              <Play
                size={11}
                fill="#fff"
                stroke="#fff"
                style={{ marginLeft: 1 }}
              />
            </span>
            {playLabel}
          </button>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "10%",
          right: "10%",
          bottom: -26,
          height: 30,
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(10,10,10,0.16), rgba(10,10,10,0) 80%)",
          filter: "blur(6px)",
        }}
      />

      <HeroVideoModal
        open={open}
        onClose={() => setOpen(false)}
        defaultSource={defaultSource}
        mp4Src={VIDEO_SRC}
        videoLabel={videoLabel}
        closeLabel={closeLabel}
        youtubeLabel={youtubeLabel}
        bilibiliLabel={bilibiliLabel}
        fallbackHint={fallbackHint}
      />
    </div>
  );
}
