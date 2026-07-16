"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { localeMeta } from "@/i18n/locale-meta";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";

type LangSwitcherProps = {
  /**
   * Whether the menu opens below the trigger (page header) or above it (bottom
   * of the mobile overlay, where there's no room downward).
   */
  placement?: "bottom" | "top";
  className?: string;
};

export function LangSwitcher({
  placement = "bottom",
  className,
}: LangSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
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

  const switchLang = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  const current =
    localeMeta[locale as Locale] ?? localeMeta[routing.defaultLocale];

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={current.nativeName}
        className="border-border bg-foreground/5 text-muted-foreground hover:text-foreground inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-full border px-2.5 transition-colors"
      >
        <Globe aria-hidden className="size-[14px]" />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.04em",
          }}
        >
          {current.label}
        </span>
        <ChevronDown
          aria-hidden
          className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={`border-border bg-background absolute right-0 z-30 w-44 overflow-hidden rounded-lg border py-1 shadow-lg ${
            placement === "top" ? "bottom-full mb-2" : "mt-2"
          }`}
        >
          {routing.locales.map((code) => {
            const active = code === locale;
            return (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => switchLang(code)}
                className="hover:bg-bg2 flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left transition-colors"
              >
                <span className="text-foreground text-sm">
                  {localeMeta[code].nativeName}
                </span>
                {active ? (
                  <Check aria-hidden className="text-foreground size-3.5" />
                ) : (
                  <span
                    aria-hidden
                    className="text-muted2 font-mono text-[10px] tracking-wide"
                  >
                    {localeMeta[code].label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
