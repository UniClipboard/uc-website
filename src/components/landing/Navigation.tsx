"use client";

import { Github, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Icons } from "@/components/icons";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

export function Navigation() {
  const t = useTranslations("landing.navigation");
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const themeOrder = ["system", "light", "dark"] as const;
  type ThemeChoice = (typeof themeOrder)[number];
  const currentTheme: ThemeChoice =
    theme === "light" || theme === "dark" ? theme : "system";
  const nextTheme: ThemeChoice =
    themeOrder[(themeOrder.indexOf(currentTheme) + 1) % themeOrder.length];
  const themeLabels: Record<ThemeChoice, string> = {
    system: t("themeSystem"),
    light: t("themeLight"),
    dark: t("themeDark"),
  };
  const themeIcon = !mounted ? null : currentTheme === "system" ? (
    <Icons.monitor className="size-[14px]" />
  ) : currentTheme === "dark" ? (
    <Icons.moon className="size-[14px]" />
  ) : (
    <Icons.sun className="size-[14px]" />
  );

  const switchLang = (next: "zh" | "en") => {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  const navLinks = [
    { href: "#features", label: t("features") },
    { href: "#compare", label: t("compare") },
    { href: "/blog", label: t("blog") },
    { href: "#download", label: t("download") },
    { href: "#faq", label: t("faq") },
  ];

  const renderNavLink = (
    link: (typeof navLinks)[number],
    className: string,
    onClick?: () => void,
    showArrow = false,
  ) =>
    link.href.startsWith("/") ? (
      <Link
        key={link.href}
        className={className}
        href={link.href}
        onClick={onClick}
      >
        {link.label}
        {showArrow && (
          <span
            className="text-muted2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.05em",
            }}
          >
            ↗
          </span>
        )}
      </Link>
    ) : (
      <a
        key={link.href}
        className={className}
        href={link.href}
        onClick={onClick}
      >
        {link.label}
        {showArrow && (
          <span
            className="text-muted2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.05em",
            }}
          >
            ↗
          </span>
        )}
      </a>
    );

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="landing-shell flex items-center justify-between py-7">
        <a href="#top" className="flex items-baseline gap-3">
          <span className="wordmark text-foreground text-[28px]">
            UniClipboard
          </span>
        </a>

        <div className="text-muted-foreground hidden items-center gap-7 text-[13px] md:flex">
          {navLinks.map((link) =>
            renderNavLink(link, "hover:text-foreground transition-colors"),
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <div
            role="tablist"
            className="border-border bg-foreground/5 hidden rounded-full border p-[2px] sm:inline-flex"
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
            title={mounted ? themeLabels[currentTheme] : undefined}
            onClick={() => setTheme(nextTheme)}
            className="border-border bg-foreground/5 text-muted-foreground hover:text-foreground hidden size-[30px] cursor-pointer items-center justify-center rounded-full border transition-colors sm:inline-flex"
            suppressHydrationWarning
          >
            {themeIcon}
          </button>

          <a
            href="https://github.com/UniClipboard/UniClipboard"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("github")}
            title={t("github")}
            className="border-border text-foreground hover:bg-foreground/5 hidden size-8 items-center justify-center rounded-lg border transition-colors sm:inline-flex"
          >
            <Github className="size-4" />
          </a>

          <a
            href="#download"
            className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-lg px-3 py-2 text-[12px] font-medium md:hidden"
          >
            {t("download")}
          </a>

          <button
            type="button"
            aria-label={menuOpen ? t("menuClose") : t("menu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="border-border text-foreground hover:bg-foreground/5 inline-flex size-8 items-center justify-center rounded-lg border transition-colors md:hidden"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          className="bg-background border-border fixed inset-x-0 top-[78px] bottom-0 z-40 border-t md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="landing-shell flex h-full flex-col gap-1 py-6">
            {navLinks.map((link) => (
              <div key={link.href}>
                {renderNavLink(
                  link,
                  "text-foreground hover:bg-foreground/5 flex items-center justify-between rounded-lg px-3 py-3.5 text-[16px] font-medium transition-colors",
                  () => setMenuOpen(false),
                  true,
                )}
              </div>
            ))}

            <div className="border-border mt-4 flex items-center gap-3 border-t pt-5">
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
                    color:
                      locale === "zh" ? "var(--background)" : "var(--muted)",
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
                    color:
                      locale === "en" ? "var(--background)" : "var(--muted)",
                  }}
                >
                  EN
                </button>
              </div>
              <button
                type="button"
                aria-label="Toggle theme"
                title={mounted ? themeLabels[currentTheme] : undefined}
                onClick={() => setTheme(nextTheme)}
                className="border-border bg-foreground/5 text-muted-foreground hover:text-foreground inline-flex size-[30px] cursor-pointer items-center justify-center rounded-full border transition-colors"
                suppressHydrationWarning
              >
                {themeIcon}
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
          </div>
        </div>
      )}
    </header>
  );
}
