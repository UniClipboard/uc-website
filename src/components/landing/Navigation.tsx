"use client";

import { useLocale } from "next-intl";

import { LangSwitcher } from "@/components/lang-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { getFormUrl } from "@/lib/form-config";

export function Navigation() {
  const locale = useLocale();
  const formUrl = getFormUrl(locale as "zh" | "en");

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
          <div className="flex items-center gap-2">
            <LangSwitcher className="h-9 w-9" />
            <ThemeSwitcher className="h-9 w-9" />
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
