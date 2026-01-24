"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Icons } from "@/components/icons";
import { getFormUrl } from "@/lib/form-config";

const switchLocalePathname = (pathname: string, nextLocale: "en" | "zh") => {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  if (maybeLocale === "en" || maybeLocale === "zh") {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }

  if (pathname === "/") return `/${nextLocale}`;
  return `/${nextLocale}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
};

export function Navigation() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const formUrl = getFormUrl(locale as "zh" | "en");

  const { scrollY } = useScroll();
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== "undefined" ? window.scrollY > 64 : false,
  );

  useEffect(() => {
    const next = window.scrollY > 64;
    setIsCompact((prev) => (prev === next ? prev : next));
  }, []);

  useMotionValueEvent(scrollY, "change", (v: number) => {
    const next = v > 64;
    setIsCompact((prev) => (prev === next ? prev : next));
  });

  const nextLocale = locale === "en" ? "zh" : "en";
  const nextTheme = theme === "dark" ? "light" : "dark";

  const headerVariants = {
    expanded: { top: 0 },
    compact: { top: 24 },
  } as const;

  const navVariants = {
    expanded: { borderRadius: 0, maxWidth: "100%", width: "100%" },
    compact: { borderRadius: 9999, maxWidth: 1100, width: "95%" },
  } as const;

  const backgroundVariants = {
    expanded: { opacity: 0 },
    compact: { opacity: 1 },
  } as const;

  const borderVariants = {
    expanded: { opacity: 1 },
    compact: { opacity: 0 },
  } as const;

  return (
    <>
      <motion.header
        data-testid="nav-root"
        data-nav-variant={isCompact ? "compact" : "expanded"}
        className="fixed inset-x-0 z-50"
        initial={false}
        animate={isCompact ? "compact" : "expanded"}
        variants={headerVariants}
        transition={{ type: "spring", stiffness: 520, damping: 46 }}
      >
        <motion.nav
          data-testid="nav-shell"
          data-nav-shape={isCompact ? "pill" : "square"}
          className="relative mx-auto overflow-hidden"
          initial={false}
          animate={isCompact ? "compact" : "expanded"}
          variants={navVariants}
          transition={{ type: "spring", stiffness: 520, damping: 46 }}
        >
          <motion.div
            aria-hidden="true"
            className="border-border/70 pointer-events-none absolute inset-0 border-b"
            style={{ borderRadius: "inherit" }}
            initial={false}
            animate={isCompact ? "compact" : "expanded"}
            variants={borderVariants}
            transition={{ duration: 0.18, ease: "easeOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="glass-panel border-border pointer-events-none absolute inset-0 border shadow-sm"
            style={{ borderRadius: "inherit" }}
            initial={false}
            animate={isCompact ? "compact" : "expanded"}
            variants={backgroundVariants}
            transition={{ duration: 0.18, ease: "easeOut" }}
          />

          <div className="relative z-10 mx-auto flex w-full max-w-[1100px] items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg shadow-sm">
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
                  ></path>
                </svg>
              </div>
              <h2 className="text-foreground text-lg font-bold tracking-tight">
                UniClipboard
              </h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden items-center gap-8 md:flex">
                <a
                  className="hover:text-foreground text-muted-foreground text-xs font-bold tracking-widest uppercase transition-colors"
                  href="#features"
                >
                  Features
                </a>
                <a
                  className="hover:text-foreground text-muted-foreground text-xs font-bold tracking-widest uppercase transition-colors"
                  href="#trust"
                >
                  Trust
                </a>
                <a
                  className="hover:text-foreground text-muted-foreground text-xs font-bold tracking-widest uppercase transition-colors"
                  href="#roadmap"
                >
                  Roadmap
                </a>
              </div>
              <div
                data-testid="nav-controls"
                className="bg-background/60 border-border/60 hidden h-9 items-center rounded-full border px-1 backdrop-blur-md md:flex"
              >
                <button
                  type="button"
                  aria-label="Switch language"
                  onClick={() =>
                    router.push(switchLocalePathname(pathname, nextLocale))
                  }
                  className="hover:bg-background/70 text-foreground focus-visible:ring-ring/30 inline-flex size-7 items-center justify-center rounded-full transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
                >
                  <Icons.globe className="size-4" />
                </button>
                <span className="bg-border/80 mx-1 h-5 w-px" />
                <button
                  type="button"
                  aria-label="Toggle theme"
                  onClick={() => setTheme(nextTheme)}
                  className="hover:bg-background/70 text-foreground focus-visible:ring-ring/30 inline-flex size-7 items-center justify-center rounded-full transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
                >
                  <Icons.sun className="size-4 dark:hidden" />
                  <Icons.moon className="hidden size-4 dark:block" />
                </button>
              </div>
              <a
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2.5 text-xs font-bold tracking-wider uppercase transition-all"
              >
                Get Early Access
              </a>
            </div>
          </div>
        </motion.nav>
      </motion.header>
      <div className="fixed right-6 bottom-6 z-50 flex md:hidden">
        <div
          data-testid="mobile-nav-controls"
          className="bg-background/60 border-border/60 flex flex-col items-center rounded-full border p-1 backdrop-blur-md"
        >
          <button
            type="button"
            aria-label="Switch language"
            onClick={() =>
              router.push(switchLocalePathname(pathname, nextLocale))
            }
            className="hover:bg-background/70 text-foreground focus-visible:ring-ring/30 inline-flex size-7 items-center justify-center rounded-full transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
          >
            <Icons.globe className="size-4" />
          </button>
          <span className="bg-border/80 my-1 h-px w-5" />
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme(nextTheme)}
            className="hover:bg-background/70 text-foreground focus-visible:ring-ring/30 inline-flex size-7 items-center justify-center rounded-full transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
          >
            <Icons.sun className="size-4 dark:hidden" />
            <Icons.moon className="hidden size-4 dark:block" />
          </button>
        </div>
      </div>
    </>
  );
}
