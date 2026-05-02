"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Network, Server } from "lucide-react";

const monoStyle = { fontFamily: "var(--font-mono)" } as const;
const CYCLE = 7;

// Shared keyframe times for the path active/inactive choreography:
// 0–0.36   direct active, relay dim
// 0.36–0.50  direct flickers (instability), relay ramps up
// 0.50–0.95  direct dim, relay active
// 0.95–1.0  reset toward direct
const PATH_TIMES = [0, 0.36, 0.4, 0.43, 0.46, 0.5, 0.55, 0.95, 1];

const DIRECT_OPACITY = [1, 1, 0.55, 1, 0.45, 0.28, 0.28, 0.28, 1];
const RELAY_OPACITY = [0.28, 0.28, 0.28, 0.4, 0.6, 1, 1, 1, 0.28];

export function NetworkFlow() {
  const reduce = useReducedMotion();

  return (
    <div className="relative grid h-full w-full grid-rows-[1fr_auto] gap-2.5 p-3 sm:p-4">
      <div className="flex items-stretch gap-2 sm:gap-3">
        <DeviceCard os="macOS" name="A" net="home" />
        <Paths reduce={!!reduce} />
        <DeviceCard os="Windows" name="B" net="remote" />
      </div>
      <TransportRow />
    </div>
  );
}

function DeviceCard({
  os,
  name,
  net,
}: {
  os: string;
  name: string;
  net: string;
}) {
  return (
    <div className="border-border bg-background relative flex w-[26%] shrink-0 flex-col overflow-hidden rounded-lg border shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="border-border/70 flex items-center justify-between gap-1 border-b px-2 py-1">
        <div className="flex shrink-0 gap-[3px]">
          <span className="bg-hair2 size-1 rounded-full" />
          <span className="bg-hair2 size-1 rounded-full" />
          <span className="bg-hair2 size-1 rounded-full" />
        </div>
        <span
          className="text-muted2 truncate text-[7.5px] tracking-[0.12em] uppercase"
          style={monoStyle}
        >
          {os}
        </span>
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2">
        <span
          className="text-foreground truncate text-[10px]"
          style={monoStyle}
        >
          device&nbsp;{name}
        </span>
        <div className="flex items-center gap-1">
          <motion.span
            aria-hidden
            className="bg-foreground/80 size-[5px] rounded-full"
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-muted2 text-[8.5px]" style={monoStyle}>
            {net}
          </span>
        </div>
      </div>
    </div>
  );
}

function Paths({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative flex flex-1 flex-col justify-center gap-3.5">
      <PathRow
        label="direct"
        latency="~8ms"
        opacityKf={DIRECT_OPACITY}
        particleDuration={1.5}
        reduce={reduce}
      />
      <PathRow
        label="relay"
        latency="~47ms"
        opacityKf={RELAY_OPACITY}
        particleDuration={2.5}
        reduce={reduce}
        hasServer
      />
    </div>
  );
}

function PathRow({
  label,
  latency,
  opacityKf,
  particleDuration,
  reduce,
  hasServer = false,
}: {
  label: string;
  latency: string;
  opacityKf: number[];
  particleDuration: number;
  reduce: boolean;
  hasServer?: boolean;
}) {
  return (
    <motion.div
      className="relative flex flex-col gap-1"
      animate={{ opacity: reduce ? 1 : opacityKf }}
      transition={{
        duration: CYCLE,
        times: PATH_TIMES,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-muted2 text-[7.5px] tracking-[0.14em] uppercase"
          style={monoStyle}
        >
          {label}
        </span>
        <span className="text-muted2 text-[8px]" style={monoStyle}>
          {latency}
        </span>
      </div>
      <div className="relative h-2 w-full">
        <div
          className={`border-border/80 absolute inset-x-0 top-1/2 -translate-y-1/2 border-t ${
            hasServer ? "border-dashed" : ""
          }`}
        />
        {hasServer && (
          <div
            className="bg-background border-border absolute top-1/2 left-1/2 z-10 flex size-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm border"
            aria-hidden
          >
            <Server className="text-muted size-2" strokeWidth={1.8} />
          </div>
        )}
        {!reduce &&
          [0, particleDuration / 3, (particleDuration * 2) / 3].map(
            (delay, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="bg-foreground/70 absolute top-1/2 z-20 size-1 -translate-y-1/2 rounded-full"
                style={{ left: 0 }}
                animate={{ left: ["-8%", "108%"], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: particleDuration,
                  delay,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0, 0.1, 0.9, 1],
                }}
              />
            ),
          )}
      </div>
    </motion.div>
  );
}

function TransportRow() {
  return (
    <div className="border-border bg-background flex items-center gap-2.5 rounded-md border border-dashed px-2.5 py-1.5">
      <div className="bg-bg2 border-border/60 flex size-6 shrink-0 items-center justify-center rounded-md border">
        <Network className="text-muted size-3" strokeWidth={1.6} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div
          className="text-muted2 text-[7.5px] tracking-[0.12em] uppercase"
          style={monoStyle}
        >
          transport · automatic fallback
        </div>
        <div
          className="text-foreground/80 truncate text-[10px]"
          style={monoStyle}
        >
          direct first · encrypted relay if direct is unstable
        </div>
      </div>
    </div>
  );
}
