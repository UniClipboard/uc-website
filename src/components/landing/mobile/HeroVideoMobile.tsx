"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  playLabel: string;
  pauseLabel: string;
  videoLabel: string;
  seekLabel: string;
};

const fmt = (s: number) => {
  if (!s || !isFinite(s)) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export function HeroVideoMobile({ playLabel, pauseLabel, videoLabel, seekLabel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [playing, setPlaying] = useState(false);
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

  const toggle = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    const v = videoRef.current;
    if (!v || !hasVideo) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const onSeek = (clientX: number, target: HTMLDivElement) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const r = target.getBoundingClientRect();
    const pct = (clientX - r.left) / r.width;
    v.currentTime = Math.max(0, Math.min(1, pct)) * v.duration;
  };

  return (
    <div className="relative w-full">
      <div
        role="presentation"
        onClick={toggle}
        className="relative w-full overflow-hidden rounded-[14px] bg-[#0A0A0A]"
        style={{
          aspectRatio: "16 / 9",
          cursor: hasVideo ? "pointer" : "default",
          boxShadow:
            "0 18px 38px -18px rgba(10,10,10,0.28), 0 0 0 1px rgba(10,10,10,0.08)",
        }}
      >
        <video
          ref={videoRef}
          src="/video/demo.mp4"
          playsInline
          muted
          preload="auto"
          aria-label={videoLabel}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          style={{ opacity: hasVideo ? 1 : 0 }}
        />

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

        {/* Center play button — visible while paused */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300"
          style={{
            opacity: !playing && hasVideo ? 1 : 0,
            background:
              !playing && hasVideo
                ? "radial-gradient(60% 70% at 50% 50%, rgba(0,0,0,0.18), rgba(0,0,0,0.36))"
                : "transparent",
          }}
        >
          <button
            type="button"
            onClick={toggle}
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

      {/* Mobile control rail — always visible while video loaded */}
      <div
        className="mt-3 flex items-center gap-3"
        style={{ opacity: hasVideo ? 1 : 0, transition: "opacity .3s" }}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? pauseLabel : playLabel}
          className="text-foreground border-border bg-card inline-flex size-9 shrink-0 items-center justify-center rounded-full border"
        >
          {playing ? (
            <Pause size={13} fill="currentColor" stroke="currentColor" />
          ) : (
            <Play
              size={13}
              fill="currentColor"
              stroke="currentColor"
              style={{ marginLeft: 1 }}
            />
          )}
        </button>

        <span
          className="text-muted-foreground"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.03em",
            minWidth: 38,
          }}
        >
          {fmt(currentTime)}
        </span>

        <div
          role="slider"
          aria-label={seekLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          tabIndex={0}
          onClick={(e) => onSeek(e.clientX, e.currentTarget)}
          onTouchEnd={(e) => {
            const t = e.changedTouches[0];
            if (t) onSeek(t.clientX, e.currentTarget);
          }}
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
          className="relative h-[4px] flex-1 rounded-full"
          style={{
            background: "var(--hair2)",
            cursor: hasVideo ? "pointer" : "default",
            touchAction: "manipulation",
          }}
        >
          <div
            className="bg-foreground absolute top-0 bottom-0 left-0 rounded-full"
            style={{ width: `${progress}%`, transition: "width .1s linear" }}
          />
        </div>

        <span
          className="text-muted2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.03em",
            minWidth: 38,
            textAlign: "right",
          }}
        >
          {fmt(duration)}
        </span>
      </div>
    </div>
  );
}
