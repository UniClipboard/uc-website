"use client";

import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Globe,
  Monitor,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { localeMeta, localePathPrefix, metaFor } from "@/i18n/locale-meta";

const locales = Object.entries(localeMeta).map(([code, meta]) => ({
  code,
  ...meta,
}));
type LocaleEntry = (typeof locales)[number];

const themes = [
  { value: "system", label: "themeSystem", Icon: Monitor },
  { value: "light", label: "themeLight", Icon: Sun },
  { value: "dark", label: "themeDark", Icon: Moon },
] as const;

// Traditional Chinese is chosen by script (zh-Hant-*) or region.
const hantRegions = /^zh-(hant|tw|hk|mo)\b/;

// Maps a BCP 47 tag to a site locale: exact tag, Traditional Chinese, then the
// base language (so pt-PT still offers pt-BR).
function localeForTag(tag: string): LocaleEntry | undefined {
  const lower = tag.toLowerCase();
  const base = lower.split("-")[0];
  return (
    locales.find((l) => l.code.toLowerCase() === lower) ??
    (hantRegions.test(lower)
      ? locales.find((l) => l.code === "zh-Hant")
      : undefined) ??
    locales.find((l) => l.code.toLowerCase() === base) ??
    locales.find((l) => l.code.toLowerCase().split("-")[0] === base)
  );
}

// Reads the browser's preferences only after mount, so the page stays static.
function browserSuggestion(current: string): LocaleEntry | undefined {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const match = localeForTag(tag);
    if (match) return match.code === current ? undefined : match;
  }
}

const matches = (entry: LocaleEntry, query: string) =>
  !query ||
  [entry.nativeName, entry.englishName, entry.code].some((value) =>
    value.toLowerCase().includes(query),
  );

function Plus({ at }: { at: string }) {
  return (
    <svg
      className={`transfer-plus transfer-plus--${at}`}
      viewBox="0 0 15 15"
      aria-hidden
    >
      <path d="M7.5 0v15M0 7.5h15" stroke="currentColor" />
    </svg>
  );
}

function LanguageOption({
  entry,
  current,
}: {
  entry: LocaleEntry;
  current: boolean;
}) {
  return (
    <a
      className="transfer-lang-option"
      href={localePathPrefix(entry.code) || "/"}
      hrefLang={entry.code}
      lang={entry.code}
      aria-current={current ? "page" : undefined}
    >
      <span className="transfer-lang-names">
        <span className="transfer-lang-native" dir={entry.dir}>
          {entry.nativeName}
        </span>
        <span className="transfer-lang-english" lang="en" dir="ltr">
          {entry.englishName}
        </span>
      </span>
      {current && <Check className="transfer-lang-check" aria-hidden />}
      <span className="transfer-lang-code" dir="ltr">
        {entry.code}
      </span>
    </a>
  );
}

function LanguageMenu() {
  const locale = useLocale();
  const t = useTranslations("try.header");
  const nav = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggested, setSuggested] = useState<LocaleEntry>();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const panelId = useId();

  useEffect(() => setSuggested(browserSuggestion(locale)), [locale]);
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    // Escape closes; arrows move between the search field and the options.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        trigger.current?.focus();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const items = Array.from(
        root.current?.querySelectorAll<HTMLElement>(
          ".transfer-lang-search input, .transfer-lang-option",
        ) ?? [],
      );
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (index < 0) return;
      const next = items[index + (e.key === "ArrowDown" ? 1 : -1)];
      if (next) {
        e.preventDefault();
        next.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const all = useMemo(() => locales.filter((l) => matches(l, q)), [q]);
  const suggestion = suggested && matches(suggested, q) ? suggested : undefined;

  return (
    <div className="transfer-lang" ref={root}>
      <button
        ref={trigger}
        type="button"
        className="transfer-cell transfer-lang-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`${nav("language")}: ${metaFor(locale).nativeName}`}
        onClick={() => {
          setQuery("");
          setOpen((value) => !value);
        }}
      >
        <Globe className="transfer-lang-globe" aria-hidden />
        <X className="transfer-lang-close" aria-hidden />
        <span className="transfer-lang-current" dir={metaFor(locale).dir}>
          {metaFor(locale).nativeName}
        </span>
        <ChevronDown className="transfer-lang-chevron" aria-hidden />
      </button>
      {open && (
        <div
          id={panelId}
          className="transfer-lang-panel"
          role="dialog"
          aria-label={nav("language")}
        >
          <div className="transfer-lang-head">
            <p className="transfer-lang-title">{nav("language")}</p>
            <label className="transfer-lang-search">
              <Search aria-hidden />
              <span className="sr-only">{t("languageSearch")}</span>
              <input
                type="search"
                ref={search}
                autoComplete="off"
                spellCheck={false}
                placeholder={t("languageSearch")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>Esc</kbd>
            </label>
          </div>
          <div className="transfer-lang-body">
            {suggestion && (
              <section aria-label={t("languageSuggested")}>
                <p className="transfer-lang-label">{t("languageSuggested")}</p>
                <LanguageOption entry={suggestion} current={false} />
              </section>
            )}
            <section aria-label={t("languageAll")}>
              <p className="transfer-lang-label">
                {t("languageAll")} · {locales.length}
              </p>
              {all.length ? (
                <ul>
                  {all.map((entry) => (
                    <li key={entry.code}>
                      <LanguageOption
                        entry={entry}
                        current={entry.code === locale}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="transfer-lang-empty">{t("languageEmpty")}</p>
              )}
            </section>
          </div>
          <button
            type="button"
            className="sr-only"
            onClick={() => {
              setOpen(false);
              trigger.current?.focus();
            }}
          >
            {t("languageClose")}
          </button>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const nav = useTranslations("nav");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const index = Math.max(
    0,
    themes.findIndex((option) => option.value === (mounted ? theme : "system")),
  );
  const { Icon, label } = themes[index];
  const next = themes[(index + 1) % themes.length];
  return (
    <button
      type="button"
      className="transfer-cell transfer-theme"
      aria-label={`${nav("theme")}: ${nav(label)}`}
      title={`${nav("theme")}: ${nav(label)}`}
      data-theme-choice={themes[index].value}
      onClick={() => setTheme(next.value)}
    >
      <Icon aria-hidden />
    </button>
  );
}

export function Header() {
  const locale = useLocale();
  const t = useTranslations("try");
  const prefix = localePathPrefix(locale);
  return (
    <header className="transfer-header">
      <div className="transfer-bar">
        <a
          className="transfer-cell transfer-brand"
          href={`https://www.uniclipboard.app${prefix}`}
        >
          <span className="transfer-dot" aria-hidden />
          UniClipboard
        </a>
        <p className="transfer-tagline">{t("header.tagline")}</p>
        <LanguageMenu />
        <ThemeToggle />
        <a
          className="transfer-cell transfer-get"
          href={`https://www.uniclipboard.app${prefix}/download`}
        >
          {t("footer.getApp")}
          <ArrowUpRight aria-hidden />
        </a>
        <Plus at="tl" />
        <Plus at="tr" />
        <Plus at="bl" />
        <Plus at="br" />
      </div>
    </header>
  );
}
