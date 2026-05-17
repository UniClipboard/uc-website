"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { HeroVideoModal, type HeroVideoSource } from "../HeroVideoModal";

type Props = {
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

export function HeroVideoMobile({
  playLabel,
  videoLabel,
  openLabel,
  closeLabel,
  youtubeLabel,
  bilibiliLabel,
  fallbackHint,
  defaultSource,
}: Props) {
  const [open, setOpen] = useState(false);

  const openModal = () => setOpen(true);

  return (
    <div className="relative w-full">
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
        className="relative w-full cursor-pointer overflow-hidden rounded-[14px] bg-[#0A0A0A]"
        style={{
          aspectRatio: "16 / 9",
          boxShadow:
            "0 18px 38px -18px rgba(10,10,10,0.28), 0 0 0 1px rgba(10,10,10,0.08)",
        }}
      >
        <Image
          src={POSTER_SRC}
          alt=""
          aria-hidden
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />

        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{
            background:
              "radial-gradient(60% 70% at 50% 50%, rgba(0,0,0,0.18), rgba(0,0,0,0.36))",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal();
            }}
            aria-label={playLabel}
            className="pointer-events-auto inline-flex items-center justify-center rounded-full"
            style={{
              width: 56,
              height: 56,
              background: "rgba(255,255,255,0.96)",
              color: "#0A0A0A",
              boxShadow:
                "0 10px 28px -8px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.6) inset",
              backdropFilter: "blur(8px)",
            }}
          >
            <Play
              size={18}
              fill="#0A0A0A"
              stroke="#0A0A0A"
              style={{ marginLeft: 2 }}
            />
          </button>
        </div>
      </div>

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
