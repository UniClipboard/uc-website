"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { localeMeta, localePathPrefix } from "@/i18n/locale-meta";

export function Header() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <header className="transfer-header">
      <a
        className="transfer-brand"
        href={`https://www.uniclipboard.app${localePathPrefix(locale)}`}
      >
        UniClipboard
      </a>
      <div className="transfer-settings">
        <nav aria-label={t("language")}>
          {Object.entries(localeMeta).map(([code, meta]) => (
            <a
              key={code}
              href={localePathPrefix(code) || "/"}
              hrefLang={code}
              lang={code}
              aria-current={locale === code ? "page" : undefined}
            >
              {meta.label}
            </a>
          ))}
        </nav>
        <select
          aria-label={t("theme")}
          value={mounted ? theme : "system"}
          onChange={(e) => setTheme(e.target.value)}
        >
          <option value="system">{t("themeSystem")}</option>
          <option value="light">{t("themeLight")}</option>
          <option value="dark">{t("themeDark")}</option>
        </select>
      </div>
    </header>
  );
}
