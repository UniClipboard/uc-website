"use client";

import { Github } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Icons } from "@/components/icons";
import { usePathname, useRouter } from "@/i18n/navigation";

export function Navigation() {
  const t = useTranslations("landing.navigation");
  const { theme, setTheme, resolvedTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted && resolvedTheme === "dark";
  const nextTheme = theme === "dark" ? "light" : "dark";

  const switchLang = (next: "zh" | "en") => {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="landing-shell flex items-center justify-between py-7">
        <a href="#top" className="flex items-baseline gap-3">
          <span className="wordmark text-foreground text-[28px]">
            UniClipboard
          </span>
        </a>

        <div className="text-muted-foreground hidden items-center gap-7 text-[13px] md:flex">
          <a
            className="hover:text-foreground transition-colors"
            href="#features"
          >
            {t("features")}
          </a>
          <a className="hover:text-foreground transition-colors" href="#how">
            {t("how")}
          </a>
          <a
            className="hover:text-foreground transition-colors"
            href="#download"
          >
            {t("download")}
          </a>
          <a className="hover:text-foreground transition-colors" href="#faq">
            {t("faq")}
          </a>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            role="tablist"
            className="border-border bg-foreground/5 inline-flex rounded-full border p-[2px]"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.04em",
            }}
          >
            <button
              type="button"
              onClick={() => switchLang("zh")}
              className="cursor-pointer rounded-full px-2.5 py-1 transition-colors"
              style={{
                background:
                  locale === "zh" ? "var(--foreground)" : "transparent",
                color: locale === "zh" ? "var(--background)" : "var(--muted)",
              }}
            >
              ZH
            </button>
            <button
              type="button"
              onClick={() => switchLang("en")}
              className="cursor-pointer rounded-full px-2.5 py-1 transition-colors"
              style={{
                background:
                  locale === "en" ? "var(--foreground)" : "transparent",
                color: locale === "en" ? "var(--background)" : "var(--muted)",
              }}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme(nextTheme)}
            className="border-border bg-foreground/5 text-muted-foreground hover:text-foreground inline-flex size-[30px] cursor-pointer items-center justify-center rounded-full border transition-colors"
            suppressHydrationWarning
          >
            {mounted &&
              (dark ? (
                <Icons.sun className="size-[14px]" />
              ) : (
                <Icons.moon className="size-[14px]" />
              ))}
          </button>

          <a
            href="https://github.com/UniClipboard/UniClipboard"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("github")}
            title={t("github")}
            className="border-border text-foreground hover:bg-foreground/5 inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
          >
            <Github className="size-4" />
          </a>
        </div>
      </nav>
    </header>
  );
}
