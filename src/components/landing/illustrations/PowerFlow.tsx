"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Code2,
  Image as ImageIcon,
  Link2,
  Search,
  Terminal,
  Type,
} from "lucide-react";
import { useEffect, useState } from "react";

const monoStyle = { fontFamily: "var(--font-mono)" } as const;

type Item = { Icon: LucideIcon; title: string; time: string };

const ITEMS: Item[] = [
  { Icon: Code2, title: "API_KEY=sk-ant-***", time: "2m" },
  { Icon: Link2, title: "github.com/zed/api", time: "5m" },
  { Icon: Type, title: "API endpoint changed", time: "12m" },
  { Icon: ImageIcon, title: "screenshot.png", time: "1h" },
];

const QUERY = "api";

function useTypewriter(target: string, enabled: boolean) {
  const [text, setText] = useState(enabled ? "" : target);

  useEffect(() => {
    if (!enabled) {
      setText(target);
      return;
    }

    const typeMs = 110;
    const typeSteps = target.length;
    const holdSteps = Math.round(2200 / typeMs);
    const eraseSteps = target.length;
    const restSteps = Math.round(900 / typeMs);
    const total = typeSteps + holdSteps + eraseSteps + restSteps;

    let step = 0;
    const id = setInterval(() => {
      step = (step + 1) % total;
      let len: number;
      if (step <= typeSteps) {
        len = step;
      } else if (step <= typeSteps + holdSteps) {
        len = typeSteps;
      } else if (step <= typeSteps + holdSteps + eraseSteps) {
        len = typeSteps + holdSteps + eraseSteps - step;
      } else {
        len = 0;
      }
      setText(target.slice(0, len));
    }, typeMs);

    return () => clearInterval(id);
  }, [target, enabled]);

  return text;
}

export function PowerFlow() {
  const reduce = useReducedMotion();
  const query = useTypewriter(QUERY, !reduce);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setSelectedIdx((i) => (i + 1) % ITEMS.length);
    }, 1400);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="relative grid h-full w-full grid-rows-[1fr_auto] gap-2.5 p-3 sm:p-4">
      <QuickPanel query={query} selectedIdx={selectedIdx} reduce={!!reduce} />
      <CliRow reduce={!!reduce} />
    </div>
  );
}

function QuickPanel({
  query,
  selectedIdx,
  reduce,
}: {
  query: string;
  selectedIdx: number;
  reduce: boolean;
}) {
  return (
    <div className="border-border bg-background relative flex flex-col overflow-hidden rounded-lg border shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      {/* Window chrome */}
      <div className="border-border/70 flex items-center justify-between border-b px-2.5 py-1">
        <div className="flex shrink-0 gap-[3px]">
          <span className="bg-hair2 size-1 rounded-full" />
          <span className="bg-hair2 size-1 rounded-full" />
          <span className="bg-hair2 size-1 rounded-full" />
        </div>
        <span
          className="text-muted2 text-[7.5px] tracking-[0.12em] uppercase"
          style={monoStyle}
        >
          quick panel
        </span>
      </div>

      {/* Search row */}
      <div className="border-border/70 flex items-center gap-2 border-b px-2.5 py-2">
        <Search className="text-muted2 size-3 shrink-0" strokeWidth={1.7} />
        <span
          className="text-foreground/90 flex flex-1 items-baseline text-[10px]"
          style={monoStyle}
        >
          {query.length > 0 ? (
            <span>{query}</span>
          ) : (
            <span className="text-muted2">search clipboard…</span>
          )}
          {!reduce && (
            <motion.span
              aria-hidden
              className="bg-foreground/85 ml-[1px] inline-block h-[10px] w-[1.5px] translate-y-[2px]"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
        </span>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>V</Kbd>
      </div>

      {/* Results */}
      <div className="relative flex-1 px-1 py-1">
        {ITEMS.map((item, i) => (
          <ResultRow
            key={i}
            item={item}
            active={i === selectedIdx && !reduce}
          />
        ))}
      </div>

      {/* Footer status */}
      <div className="border-border/70 text-muted2 flex items-center justify-between gap-2 border-t px-2.5 py-1 text-[7.5px] tracking-[0.1em] uppercase">
        <span style={monoStyle}>4 of 28k items</span>
        <span style={monoStyle}>indexed · ms-search</span>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <span
      className="border-border bg-bg2 text-muted shrink-0 rounded-[3px] border px-1 py-px text-[8px] tracking-wide"
      style={monoStyle}
    >
      {children}
    </span>
  );
}

function ResultRow({ item, active }: { item: Item; active: boolean }) {
  const { Icon, title, time } = item;

  return (
    <div className="relative flex items-center gap-2 rounded px-2 py-1">
      {active && (
        <motion.span
          aria-hidden
          layoutId="qp-bg"
          className="bg-bg2 absolute inset-0 rounded"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
      )}
      {active && (
        <motion.span
          aria-hidden
          layoutId="qp-bar"
          className="bg-foreground/85 absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-full"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
      )}
      <Icon
        className="text-muted relative size-2.5 shrink-0"
        strokeWidth={1.7}
      />
      <span
        className="text-foreground/90 relative flex-1 truncate text-[9.5px]"
        style={monoStyle}
      >
        {title}
      </span>
      <span
        className="text-muted2 relative shrink-0 text-[8px]"
        style={monoStyle}
      >
        {time}
      </span>
      {active && (
        <motion.span
          layoutId="qp-enter"
          className="border-border/70 bg-background text-muted2 relative shrink-0 rounded-[3px] border px-1 py-px text-[8px]"
          style={monoStyle}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        >
          ⏎
        </motion.span>
      )}
    </div>
  );
}

function CliRow({ reduce }: { reduce: boolean }) {
  return (
    <div className="border-border bg-background flex items-center gap-2.5 rounded-md border border-dashed px-2.5 py-1.5">
      <div className="bg-bg2 border-border/60 flex size-6 shrink-0 items-center justify-center rounded-md border">
        <Terminal className="text-muted size-3" strokeWidth={1.6} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div
          className="text-muted2 text-[7.5px] tracking-[0.12em] uppercase"
          style={monoStyle}
        >
          uniclip cli · headless
        </div>
        <div
          className="text-foreground/85 truncate text-[10px]"
          style={monoStyle}
        >
          <span className="text-muted2">$ </span>
          git diff
          <span className="text-muted2"> | </span>
          uniclip copy
          {!reduce && (
            <motion.span
              aria-hidden
              className="bg-foreground/85 ml-[2px] inline-block h-[8px] w-[1.5px] translate-y-[1px] align-baseline"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
