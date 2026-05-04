"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Option = {
  label: string;
  hint: string;
  href: string;
  badge: "Template" | "Markdown";
};

const OPTIONS: Option[] = [
  {
    label: "Compare",
    hint: "Side-by-side product comparison",
    href: "/admin/articles/new?category=compare",
    badge: "Template",
  },
  {
    label: "Use case",
    hint: "Step-by-step how-to article",
    href: "/admin/articles/new?category=use-cases",
    badge: "Template",
  },
  {
    label: "Blog post",
    hint: "Free-form Markdown content",
    href: "/admin/articles/new?category=blog",
    badge: "Markdown",
  },
];

export function NewArticleButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="bg-foreground text-background inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
      >
        New article
        <ChevronDown
          aria-hidden
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="border-border bg-background absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-lg border shadow-lg"
        >
          {OPTIONS.map((opt) => (
            <Link
              key={opt.href}
              role="menuitem"
              href={opt.href}
              onClick={() => setOpen(false)}
              className="hover:bg-bg2 flex items-start justify-between gap-3 px-4 py-3 transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground text-sm font-medium">
                  {opt.label}
                </span>
                <span className="text-muted-foreground text-xs">
                  {opt.hint}
                </span>
              </div>
              <span
                className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase ${
                  opt.badge === "Markdown"
                    ? "bg-foreground/10 text-foreground"
                    : "bg-bg2 text-muted-foreground border-border border"
                }`}
              >
                {opt.badge}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
