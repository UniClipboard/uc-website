"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";

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

  const nextLocale = locale === "en" ? "zh" : "en";
  const languageLabel = locale === "en" ? "中文" : "EN";
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header className="fixed top-6 left-1/2 z-50 w-[95%] max-w-[1100px] -translate-x-1/2">
      <nav className="glass-panel flex items-center justify-between rounded-2xl border border-slate-200 px-6 py-4 shadow-sm dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="bg-gray-dark flex size-9 items-center justify-center rounded-lg text-white shadow-sm">
            <svg
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
          <h2 className="text-gray-dark text-lg font-bold tracking-tight dark:text-slate-100">
            UniClipboard
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-8 md:flex">
            <a
              className="hover:text-gray-dark text-xs font-bold tracking-widest text-slate-500 uppercase transition-colors dark:hover:text-slate-100"
              href="#features"
            >
              Features
            </a>
            <a
              className="hover:text-gray-dark text-xs font-bold tracking-widest text-slate-500 uppercase transition-colors dark:hover:text-slate-100"
              href="#trust"
            >
              Trust
            </a>
            <a
              className="hover:text-gray-dark text-xs font-bold tracking-widest text-slate-500 uppercase transition-colors dark:hover:text-slate-100"
              href="#roadmap"
            >
              Roadmap
            </a>
          </div>
          <div
            data-testid="nav-controls"
            className="flex h-9 items-center rounded-full border border-slate-200/60 bg-white/60 px-1 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-950/30"
          >
            <button
              type="button"
              aria-label="Switch language"
              onClick={() =>
                router.push(switchLocalePathname(pathname, nextLocale))
              }
              className="inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold tracking-wide text-slate-700 transition-colors hover:bg-white/70 focus-visible:ring-[3px] focus-visible:ring-slate-400/30 focus-visible:outline-none dark:text-slate-200 dark:hover:bg-slate-800/50 dark:focus-visible:ring-slate-500/30"
            >
              {languageLabel}
            </button>
            <span className="mx-1 h-5 w-px bg-slate-200/80 dark:bg-slate-700/80" />
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={() => setTheme(nextTheme)}
              className="inline-flex size-7 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white/70 focus-visible:ring-[3px] focus-visible:ring-slate-400/30 focus-visible:outline-none dark:text-slate-200 dark:hover:bg-slate-800/50 dark:focus-visible:ring-slate-500/30"
            >
              <Icons.sun className="size-4 dark:hidden" />
              <Icons.moon className="hidden size-4 dark:block" />
            </button>
          </div>
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-dark rounded-lg px-5 py-2.5 text-xs font-bold tracking-wider text-white uppercase transition-all hover:bg-slate-800"
          >
            Get Early Access
          </a>
        </div>
      </nav>
    </header>
  );
}
