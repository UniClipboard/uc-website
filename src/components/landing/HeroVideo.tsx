"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type HeroVideoProps = {
  playLabel: string;
  pauseLabel: string;
  durationLabel: string;
  videoLabel: string;
};

const fmt = (s: number) => {
  if (!s || !isFinite(s)) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export function HeroVideo({
  playLabel,
  pauseLabel,
  durationLabel,
  videoLabel,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => {
      setHasVideo(true);
      setDuration(v.duration || 0);
    };
    const onTime = () => {
      setCurrentTime(v.currentTime || 0);
      if (v.duration) setProgress((v.currentTime / v.duration) * 100);
    };
    const onPlayEvt = () => setPlaying(true);
    const onPauseEvt = () => setPlaying(false);
    v.addEventListener("loadeddata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlayEvt);
    v.addEventListener("pause", onPauseEvt);
    if (v.readyState >= 2) onLoaded();
    return () => {
      v.removeEventListener("loadeddata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlayEvt);
      v.removeEventListener("pause", onPauseEvt);
    };
  }, []);

  const onPlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const v = videoRef.current;
    if (!v || !hasVideo) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const showControls = (hover || !playing) && hasVideo;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative w-full"
    >
      {/* Ambient brand glow */}
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

      {/* Cinematic video card */}
      <div
        role="presentation"
        aria-label={videoLabel}
        onClick={onPlay}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPlay();
          }
        }}
        className="relative w-full overflow-hidden rounded-[20px] bg-[#0A0A0A] transition-all duration-500"
        style={{
          aspectRatio: "16 / 9",
          cursor: hasVideo ? "pointer" : "default",
          boxShadow: hover
            ? "0 60px 120px -28px rgba(10,10,10,0.34), 0 24px 48px -22px rgba(10,10,10,0.20), 0 0 0 1px rgba(10,10,10,0.10)"
            : "0 40px 90px -30px rgba(10,10,10,0.22), 0 16px 32px -16px rgba(10,10,10,0.12), 0 0 0 1px rgba(10,10,10,0.07)",
          transform: hover ? "translateY(-3px)" : "translateY(0)",
        }}
      >
        <video
          ref={videoRef}
          src="/video/demo.mp4"
          playsInline
          muted
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          style={{ opacity: hasVideo ? 1 : 0 }}
        />

        {/* Loading shimmer when no video */}
        {!hasVideo && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div
              className="absolute inset-y-0 w-[40%]"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                animation: "uc-shimmer 2.4s linear infinite",
                left: "-40%",
              }}
            />
          </div>
        )}

        {/* Center play affordance — visible while paused */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300"
          style={{
            opacity: !playing && hasVideo ? 1 : 0,
            background:
              !playing && hasVideo
                ? "radial-gradient(60% 70% at 50% 50%, rgba(0,0,0,0.18), rgba(0,0,0,0.32))"
                : "transparent",
          }}
        >
          <button
            type="button"
            onClick={onPlay}
            aria-label={playLabel}
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

        {/* Bottom scrim */}
        <div
          className="pointer-events-none absolute right-0 bottom-0 left-0 h-[88px] transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.2) 55%, transparent)",
            opacity: showControls && playing ? 1 : 0,
          }}
        />

        {/* Bottom controls — only while playing + hover */}
        <div
          className="absolute right-5 bottom-4 left-5 flex items-center gap-3 transition-opacity duration-300"
          style={{ opacity: showControls && playing ? 1 : 0 }}
        >
          <button
            type="button"
            onClick={onPlay}
            aria-label={pauseLabel}
            className="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/25"
            style={{
              background: "rgba(255,255,255,0.14)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)",
              backdropFilter: "blur(6px)",
            }}
          >
            <Pause size={11} fill="white" stroke="white" />
          </button>

          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "rgba(255,255,255,0.92)",
              letterSpacing: "0.03em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {fmt(currentTime)}
          </span>

          <div
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            tabIndex={0}
            onKeyDown={(e) => {
              const v = videoRef.current;
              if (!v || !v.duration) return;
              if (e.key === "ArrowRight") {
                e.preventDefault();
                v.currentTime = Math.min(v.duration, v.currentTime + 5);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                v.currentTime = Math.max(0, v.currentTime - 5);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              const v = videoRef.current;
              if (!v || !v.duration) return;
              const r = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - r.left) / r.width;
              v.currentTime = Math.max(0, Math.min(1, pct)) * v.duration;
            }}
            className="group relative h-[3px] flex-1 rounded-full"
            style={{
              background: "rgba(255,255,255,0.18)",
              cursor: hasVideo ? "pointer" : "default",
            }}
          >
            <div
              className="absolute top-0 bottom-0 left-0 rounded-full bg-white transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 h-[11px] w-[11px] -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                left: `calc(${progress}% - 5.5px)`,
                boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
              }}
            />
          </div>

          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.03em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {hasVideo ? fmt(duration) : durationLabel}
          </span>
        </div>
      </div>

      {/* Reflection floor */}
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
    </div>
  );
}
