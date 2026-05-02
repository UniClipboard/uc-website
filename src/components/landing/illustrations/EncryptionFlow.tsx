"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  Database,
  FileText,
  Image as ImageIcon,
  Lock,
} from "lucide-react";
import { useEffect, useState } from "react";

const HEX = "0123456789abcdef";
const CYCLE = 7;
const monoStyle = { fontFamily: "var(--font-mono)" } as const;

type Item = {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
};

const ITEMS: Item[] = [
  { Icon: AlignLeft, title: "password: hunter2", subtitle: "text · 17 B" },
  { Icon: ImageIcon, title: "screenshot.png", subtitle: "1240 × 880" },
  { Icon: FileText, title: "report.pdf", subtitle: "2.4 MB" },
];

function gen(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += HEX[Math.floor(Math.random() * 16)];
  return s;
}

function chunked(s: string, n = 4) {
  return s.match(new RegExp(`.{1,${n}}`, "g"))!.join(" ");
}

const SEED_STORE = chunked("0".repeat(40));
const SEED_WIRE = chunked("0".repeat(16));

export function EncryptionFlow() {
  const reduce = useReducedMotion();
  const [storeHex, setStoreHex] = useState(SEED_STORE);
  const [wireHex, setWireHex] = useState(SEED_WIRE);

  useEffect(() => {
    setStoreHex(chunked(gen(40)));
    setWireHex(chunked(gen(16)));
    if (reduce) return;
    const t1 = setInterval(() => setStoreHex(chunked(gen(40))), 120);
    const t2 = setInterval(() => setWireHex(chunked(gen(16))), 85);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [reduce]);

  return (
    <div className="relative grid h-full w-full grid-rows-[1fr_auto] gap-2.5 p-3 sm:p-4">
      <div className="flex items-stretch gap-2 sm:gap-2.5">
        <DeviceCard label="A" phase={0} reduce={!!reduce} />
        <Wire wireHex={wireHex} reduce={!!reduce} />
        <DeviceCard label="B" phase={1} reduce={!!reduce} />
      </div>
      <StorageRow hex={storeHex} />
    </div>
  );
}

function DeviceCard({
  label,
  phase,
  reduce,
}: {
  label: string;
  phase: 0 | 1;
  reduce: boolean;
}) {
  return (
    <div className="border-border bg-background relative flex flex-1 flex-col overflow-hidden rounded-lg border shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      {/* Window chrome */}
      <div className="border-border/70 flex items-center justify-between border-b px-2 py-1">
        <div className="flex gap-[3px]">
          <span className="bg-hair2 size-1 rounded-full" />
          <span className="bg-hair2 size-1 rounded-full" />
          <span className="bg-hair2 size-1 rounded-full" />
        </div>
        <span
          className="text-muted2 text-[7.5px] tracking-[0.12em] uppercase"
          style={monoStyle}
        >
          device&nbsp;{label}
        </span>
      </div>
      {/* Item list */}
      <div className="divide-border/40 relative flex flex-1 flex-col justify-center divide-y px-1">
        {ITEMS.map((item, i) => (
          <ItemRow
            key={i}
            item={item}
            phase={phase}
            index={i}
            reduce={reduce}
          />
        ))}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  phase,
  index,
  reduce,
}: {
  item: Item;
  phase: 0 | 1;
  index: number;
  reduce: boolean;
}) {
  const Icon = item.Icon;

  // Sequential transmission: one item at a time.
  // A (sender) shows item N, then it travels the wire, then it appears on B.
  // Items accumulate on each side until the cycle resets.
  const APPEAR_GAP = 0.3; // gap between consecutive items appearing on the same device
  const TRANSIT = 0.15; // delay between an item appearing on A and on B
  const appearAtA = 0.02 + index * APPEAR_GAP;
  const appearAt = phase === 0 ? appearAtA : appearAtA + TRANSIT;

  // [0, fadeInStart, fullyVisible, holdUntil, fadeOutDone, end]
  const times = [0, appearAt, appearAt + 0.05, 0.92, 0.97, 1];

  const content = (
    <>
      <div className="bg-bg2 border-border/60 flex size-6 shrink-0 items-center justify-center rounded-md border">
        <Icon className="text-muted size-3" strokeWidth={1.6} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className="text-foreground truncate text-[9.5px]"
          style={monoStyle}
        >
          {item.title}
        </span>
        <span className="text-muted2 truncate text-[7.5px]" style={monoStyle}>
          {item.subtitle}
        </span>
      </div>
    </>
  );

  if (reduce) {
    return (
      <div className="flex items-center gap-2 px-1.5 py-1.5">{content}</div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-2 px-1.5 py-1.5"
      animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
      transition={{
        duration: CYCLE,
        times,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {content}
    </motion.div>
  );
}

function Wire({ wireHex, reduce }: { wireHex: string; reduce: boolean }) {
  return (
    <div className="relative flex w-[26%] shrink-0 flex-col items-stretch justify-center gap-1.5 px-0.5">
      <div className="flex items-center justify-center gap-1">
        <Lock className="text-muted2 size-2.5" strokeWidth={1.8} aria-hidden />
        <span
          className="text-muted2 text-[7.5px] tracking-[0.12em] uppercase"
          style={monoStyle}
        >
          in transit
        </span>
      </div>

      <div className="border-border/80 bg-bg2 relative h-9 w-full overflow-hidden rounded-md border border-dashed">
        {/* Cipher text — always present */}
        <div
          className="text-muted absolute inset-0 flex items-center justify-center text-[9px] tracking-[0.04em]"
          style={monoStyle}
        >
          {wireHex}
        </div>

        {/* Subtle moving highlight */}
        {!reduce && (
          <motion.div
            className="pointer-events-none absolute inset-y-0 w-1/3"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in oklab, var(--foreground) 8%, transparent), transparent)",
            }}
            animate={{ left: ["-33%", "100%"] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Travelling particles */}
        {!reduce &&
          [0, 0.55, 1.1].map((delay, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="bg-foreground/65 absolute top-1/2 size-1 -translate-y-1/2 rounded-full"
              style={{ left: 0 }}
              animate={{
                left: ["-6%", "106%"],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2.2,
                delay,
                repeat: Infinity,
                ease: "linear",
                times: [0, 0.08, 0.92, 1],
              }}
            />
          ))}
      </div>

      <span className="text-muted2 text-center text-[7.5px]" style={monoStyle}>
        {"// server sees only this"}
      </span>
    </div>
  );
}

function StorageRow({ hex }: { hex: string }) {
  return (
    <div className="border-border bg-background flex items-center gap-2.5 rounded-md border border-dashed px-2.5 py-1.5">
      <div className="bg-bg2 border-border/60 flex size-6 shrink-0 items-center justify-center rounded-md border">
        <Database className="text-muted size-3" strokeWidth={1.6} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div
          className="text-muted2 text-[7.5px] tracking-[0.12em] uppercase"
          style={monoStyle}
        >
          at rest · aes-256-gcm
        </div>
        <div
          className="text-foreground/80 truncate text-[10px] tracking-[0.04em]"
          style={monoStyle}
        >
          {hex}
        </div>
      </div>
    </div>
  );
}
