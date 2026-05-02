"use client";

import { useState } from "react";

type Item = { q: string; a: string };

export function FaqAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="border-border border-t">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="border-border border-b">
            <button
              type="button"
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
                maxHeight: isOpen ? 320 : 0,
                overflow: "hidden",
                transition: "max-height .35s cubic-bezier(.2,.7,.3,1)",
              }}
            >
              <div
                className="text-muted-foreground pb-[22px]"
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  maxWidth: 580,
                  whiteSpace: "pre-line",
                }}
              >
                {it.a}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
