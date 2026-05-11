"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type FaqItem = {
  q: string;
  a: string;
  cta?: { label: string; href: string };
};

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState(0);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const innerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [panelHeights, setPanelHeights] = useState<number[]>([]);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const measure = () => {
      const heights = innerRefs.current.map((el) => el?.offsetHeight ?? 0);
      const buttonsTotal = buttonRefs.current.reduce(
        (sum, el) => sum + (el?.offsetHeight ?? 0),
        0,
      );
      const panelsMax = heights.length ? Math.max(...heights) : 0;
      setPanelHeights(heights);
      if (buttonsTotal > 0) setMinHeight(buttonsTotal + panelsMax);
    };
    measure();
    const ro = new ResizeObserver(measure);
    for (const el of innerRefs.current) if (el) ro.observe(el);
    for (const el of buttonRefs.current) if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [items]);

  useEffect(() => {
    const HASH_TO_INDEX: Record<string, number> = {
      "#faq-mobile": 4,
    };
    const sync = () => {
      const target = HASH_TO_INDEX[window.location.hash];
      if (typeof target === "number" && target < items.length) {
        setOpen(target);
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [items.length]);

  return (
    <div className="border-border border-t" style={{ minHeight }}>
      {items.map((it, i) => {
        const isOpen = open === i;
        const panelHeight = panelHeights[i] ?? 0;
        const measured = panelHeights.length === items.length;
        return (
          <div key={i} className="border-border border-b">
            <button
              ref={(el) => {
                buttonRefs.current[i] = el;
              }}
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="text-foreground flex w-full cursor-pointer items-center justify-between bg-transparent py-5 text-left"
              style={{
                fontSize: 17,
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              <span>{it.q}</span>
              <span
                className="text-muted-foreground"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform .25s",
                }}
              >
                +
              </span>
            </button>
            <div
              style={{
                height: isOpen ? (measured ? panelHeight : "auto") : 0,
                overflow: "hidden",
                transition: measured
                  ? "height .35s cubic-bezier(.2,.7,.3,1)"
                  : "none",
              }}
            >
              <div
                ref={(el) => {
                  innerRefs.current[i] = el;
                }}
                className="text-muted-foreground pb-[22px]"
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  maxWidth: 580,
                  whiteSpace: "pre-line",
                }}
              >
                {it.a}
                {it.cta && (
                  <a
                    href={it.cta.href}
                    className="text-foreground hover:text-foreground/70 mt-3.5 inline-flex items-center gap-1.5 underline-offset-4 transition-colors hover:underline"
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {it.cta.label}
                    <ArrowUpRight size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
