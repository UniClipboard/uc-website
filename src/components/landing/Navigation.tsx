"use client";

import { useMotionValueEvent, useScroll } from "framer-motion";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Icons } from "@/components/icons";

export function Navigation() {
  const t = useTranslations("landing.navigation");
  const { theme, setTheme } = useTheme();
  const { scrollY } = useScroll();
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== "undefined" ? window.scrollY > 64 : false,
  );

  useEffect(() => {
    const next = window.scrollY > 64;
    setIsCompact((prev) => (prev === next ? prev : next));
  }, []);

  useMotionValueEvent(scrollY, "change", (value: number) => {
    const next = value > 64;
    setIsCompact((prev) => (prev === next ? prev : next));
  });

  const nextTheme = theme === "dark" ? "light" : "dark";

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const duration = "600ms";

  return (
    <>
      <header
        data-testid="nav-root"
        data-nav-variant={isCompact ? "compact" : "expanded"}
        className="fixed inset-x-0 z-50"
        style={{
          top: isCompact ? 16 : 0,
          paddingLeft: isCompact ? 12 : 0,
          paddingRight: isCompact ? 12 : 0,
          transition: `top ${duration} ${ease}, padding ${duration} ${ease}`,
        }}
      >
        <nav
          data-testid="nav-shell"
          data-nav-shape={isCompact ? "pill" : "square"}
          className="relative mx-auto overflow-hidden border-b border-transparent"
          style={{
            maxWidth: isCompact ? 1120 : "100vw",
            borderRadius: isCompact ? 22 : 0,
            transition: `max-width ${duration} ${ease}, border-radius ${duration} ${ease}`,
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 border border-[color:color-mix(in_oklab,var(--color-border)_70%,white)] bg-[color:color-mix(in_oklab,var(--color-background)_88%,white)] shadow-[0_20px_50px_rgba(70,51,32,0.06)] backdrop-blur-xl dark:border-white/8 dark:bg-[color:color-mix(in_oklab,var(--color-background)_84%,black)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
            style={{
              borderRadius: "inherit",
              opacity: isCompact ? 1 : 0.92,
              transition: `opacity 180ms ease-out`,
            }}
          />

          <div className="relative z-10 mx-auto flex w-full max-w-[1120px] items-center justify-between gap-6 px-5 py-4 md:px-6">
            <a href="#top" className="flex shrink-0 items-center gap-3">
              <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-[1.1rem] shadow-[0_12px_30px_rgba(38,106,74,0.20)]">
                <svg
                  data-testid="nav-logo-icon"
                  aria-hidden="true"
                  focusable="false"
                  className="size-5"
                  fill="none"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-foreground text-[15px] leading-none font-semibold tracking-[-0.02em]">
                  UniClipboard
                </p>
                <p className="text-muted-foreground mt-1 hidden text-[11px] tracking-[0.16em] uppercase md:block">
                  {t("productNote")}
                </p>
              </div>
            </a>

            <div className="hidden items-center gap-7 md:flex">
              <a
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                href="#why"
              >
                {t("why")}
              </a>
              <a
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                href="#security"
              >
                {t("security")}
              </a>
              <a
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                href="#faq"
              >
                {t("faq")}
              </a>
              <a
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                href="#download"
              >
                {t("download")}
              </a>
            </div>

            <div className="flex items-center gap-3">
              <button
                data-testid="nav-controls"
                type="button"
                aria-label="Toggle theme"
                onClick={() => setTheme(nextTheme)}
                className="bg-muted/60 border-border hover:bg-muted text-foreground focus-visible:ring-ring/30 hidden size-10 items-center justify-center rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-colors focus-visible:ring-[3px] focus-visible:outline-none md:inline-flex"
              >
                <Icons.sun className="size-4 dark:hidden" />
                <Icons.moon className="hidden size-4 dark:block" />
              </button>

              <a
                href="#download"
                className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium shadow-[0_12px_30px_rgba(38,106,74,0.20)] transition-all duration-300 ease-out hover:-translate-y-0.5"
              >
                {t("primaryCta")}
              </a>
            </div>
          </div>
        </nav>
      </header>

      <div className="fixed right-5 bottom-5 z-50 flex md:hidden">
        <div
          data-testid="mobile-nav-controls"
          className="flex items-center gap-1 rounded-full border border-[color:color-mix(in_oklab,var(--color-border)_70%,white)] bg-[color:color-mix(in_oklab,var(--color-background)_90%,white)] p-1 shadow-[0_20px_40px_rgba(70,51,32,0.10)] backdrop-blur-xl dark:border-white/8 dark:bg-[color:color-mix(in_oklab,var(--color-background)_84%,black)]"
        >
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme(nextTheme)}
            className="hover:bg-accent text-foreground focus-visible:ring-ring/30 inline-flex size-8 items-center justify-center rounded-full transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
          >
            <Icons.sun className="size-4 dark:hidden" />
            <Icons.moon className="hidden size-4 dark:block" />
          </button>
          <a
            href="#download"
            className="bg-primary text-primary-foreground inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium"
          >
            {t("primaryCta")}
          </a>
        </div>
      </div>
    </>
  );
}
