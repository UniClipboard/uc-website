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
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative w-full"
    >
      {/* Ambient glow pad */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          inset: "-8% -6% -14% -6%",
          background:
            "radial-gradient(60% 55% at 50% 50%, rgba(10,10,10,0.10) 0%, rgba(10,10,10,0.04) 35%, rgba(10,10,10,0) 70%)",
          filter: "blur(8px)",
        }}
      />

      <div
        className="relative rounded-[28px] p-[6px] transition-all"
        style={{
          background: hover ? "rgba(10,10,10,0.04)" : "rgba(10,10,10,0.02)",
          boxShadow: hover
            ? "inset 0 0 0 1px rgba(10,10,10,0.10)"
            : "inset 0 0 0 1px rgba(10,10,10,0.06)",
        }}
      >
        {/* Corner brackets */}
        {[
          { top: -1, left: -1, bT: 1, bL: 1 },
          { top: -1, right: -1, bT: 1, bR: 1 },
          { bottom: -1, left: -1, bB: 1, bL: 1 },
          { bottom: -1, right: -1, bB: 1, bR: 1 },
        ].map((c, i) => (
          <div
            key={i}
            aria-hidden
            className="pointer-events-none absolute z-[2]"
            style={{
              width: 14,
              height: 14,
              top: c.top,
              left: c.left,
              right: c.right,
              bottom: c.bottom,
              borderTop: c.bT
                ? `1.5px solid ${hover ? "var(--foreground)" : "rgba(10,10,10,0.35)"}`
                : "none",
              borderBottom: c.bB
                ? `1.5px solid ${hover ? "var(--foreground)" : "rgba(10,10,10,0.35)"}`
                : "none",
              borderLeft: c.bL
                ? `1.5px solid ${hover ? "var(--foreground)" : "rgba(10,10,10,0.35)"}`
                : "none",
              borderRight: c.bR
                ? `1.5px solid ${hover ? "var(--foreground)" : "rgba(10,10,10,0.35)"}`
                : "none",
              transition: "border-color .25s ease",
            }}
          />
        ))}

        {/* PLAYBACK label */}
        <div
          className="pointer-events-none absolute z-[3] px-2"
          style={{
            top: -7,
            left: 28,
            background: "var(--background)",
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.18em",
            color: hover ? "var(--foreground)" : "var(--muted)",
            transition: "color .25s ease",
          }}
        >
          ▸ {videoLabel}
        </div>

        <div
          role="presentation"
          onClick={onPlay}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPlay();
            }
          }}
          className="relative w-full overflow-hidden rounded-[22px] bg-[#0A0A0A]"
          style={{
            aspectRatio: "16 / 9",
            cursor: hasVideo ? "pointer" : "default",
            boxShadow: hover
              ? "0 50px 90px -30px rgba(10,10,10,0.30), 0 20px 40px -20px rgba(10,10,10,0.20), inset 0 0 0 1px rgba(255,255,255,0.06)"
              : "0 40px 80px -30px rgba(10,10,10,0.25), 0 14px 30px -16px rgba(10,10,10,0.16), inset 0 0 0 1px rgba(255,255,255,0.05)",
            transform: hover ? "translateY(-2px)" : "translateY(0)",
            transition: "transform .35s ease, box-shadow .35s ease",
          }}
        >
          <video
            ref={videoRef}
            src="https://assets.uniclipboard.app/demo.mp4"
            playsInline
            muted
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
            style={{ opacity: hasVideo ? 1 : 0 }}
          />

          {/* Bottom scrim */}
          <div
            className="pointer-events-none absolute right-0 bottom-0 left-0 h-[90px] transition-opacity duration-300"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
              opacity: hover || !playing ? 1 : 0,
            }}
          />

          {/* Bottom controls */}
          <div
            className="absolute right-[26px] bottom-[22px] left-[26px] flex items-center gap-3.5 transition-opacity duration-300"
            style={{ opacity: hover || !playing ? 1 : 0 }}
          >
            <button
              type="button"
              onClick={onPlay}
              className="inline-flex cursor-pointer items-center gap-2.5 rounded-full px-4 py-[9px] pl-3 text-[#0A0A0A] transition-transform"
              style={{
                background: "rgba(255,255,255,0.96)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.005em",
                boxShadow: "0 8px 24px -8px rgba(0,0,0,0.45)",
                transform: hover ? "scale(1.04)" : "scale(1)",
              }}
            >
              {playing ? (
                <Pause size={14} fill="#0A0A0A" stroke="#0A0A0A" />
              ) : (
                <Play size={14} fill="#0A0A0A" stroke="#0A0A0A" />
              )}
              {playing ? pauseLabel : playLabel}
            </button>

            <div
              className="flex flex-1 items-center gap-3"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "rgba(255,255,255,0.55)",
                letterSpacing: "0.05em",
              }}
            >
              <span>{fmt(currentTime)}</span>
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
                className="relative h-[2px] flex-1 overflow-hidden rounded-full"
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
                  className="absolute top-0 bottom-0 w-[30%]"
                  style={{
                    left: "-30%",
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                    animation: "uc-shimmer 2.4s linear infinite",
                    opacity: hasVideo ? 0 : 1,
                  }}
                />
              </div>
              <span>{hasVideo ? fmt(duration) : durationLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reflection floor */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "8%",
          right: "8%",
          bottom: -22,
          height: 28,
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(10,10,10,0.18), rgba(10,10,10,0) 80%)",
          filter: "blur(6px)",
        }}
      />
    </div>
  );
}
