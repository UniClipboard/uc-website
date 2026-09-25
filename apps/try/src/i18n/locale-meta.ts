import { type Locale, routing } from "./routing";

type LocaleMeta = {
  /** The language's own name, shown to people choosing a language. */
  nativeName: string;
  /** English name, so the language list is searchable in English too. */
  englishName: string;
  dir: "ltr" | "rtl";
  /**
   * Which Geist subsets the locale needs. `system` means Geist lacks the
   * script (e.g. Vietnamese stacked diacritics), so no Geist sans is loaded
   * and globals.css gives the locale a system font stack instead.
   */
  fonts: "latin" | "latin-ext" | "cyrillic" | "system";
};

// Same export surface the shared transfer components use from the website's
// locale-meta, over this app's locale set.
export const localeMeta = {
  en: {
    nativeName: "English",
    englishName: "English",
    dir: "ltr",
    fonts: "latin",
  },
  zh: {
    nativeName: "简体中文",
    englishName: "Simplified Chinese",
    dir: "ltr",
    fonts: "latin",
  },
  "zh-Hant": {
    nativeName: "繁體中文",
    englishName: "Traditional Chinese",
    dir: "ltr",
    fonts: "latin",
  },
  ja: {
    nativeName: "日本語",
    englishName: "Japanese",
    dir: "ltr",
    fonts: "latin",
  },
  ko: {
    nativeName: "한국어",
    englishName: "Korean",
    dir: "ltr",
    fonts: "latin",
  },
  es: {
    nativeName: "Español",
    englishName: "Spanish",
    dir: "ltr",
    fonts: "latin",
  },
  fr: {
    nativeName: "Français",
    englishName: "French",
    dir: "ltr",
    fonts: "latin",
  },
  de: {
    nativeName: "Deutsch",
    englishName: "German",
    dir: "ltr",
    fonts: "latin",
  },
  "pt-BR": {
    nativeName: "Português (Brasil)",
    englishName: "Portuguese (Brazil)",
    dir: "ltr",
    fonts: "latin",
  },
  ru: {
    nativeName: "Русский",
    englishName: "Russian",
    dir: "ltr",
    fonts: "cyrillic",
  },
  it: {
    nativeName: "Italiano",
    englishName: "Italian",
    dir: "ltr",
    fonts: "latin",
  },
  tr: {
    nativeName: "Türkçe",
    englishName: "Turkish",
    dir: "ltr",
    fonts: "latin-ext",
  },
  vi: {
    nativeName: "Tiếng Việt",
    englishName: "Vietnamese",
    dir: "ltr",
    fonts: "system",
  },
  id: {
    nativeName: "Bahasa Indonesia",
    englishName: "Indonesian",
    dir: "ltr",
    fonts: "latin",
  },
  ar: {
    nativeName: "العربية",
    englishName: "Arabic",
    dir: "rtl",
    fonts: "latin",
  },
  hi: {
    nativeName: "हिन्दी",
    englishName: "Hindi",
    dir: "ltr",
    fonts: "latin",
  },
  th: { nativeName: "ไทย", englishName: "Thai", dir: "ltr", fonts: "latin" },
  pl: {
    nativeName: "Polski",
    englishName: "Polish",
    dir: "ltr",
    fonts: "latin-ext",
  },
  nl: {
    nativeName: "Nederlands",
    englishName: "Dutch",
    dir: "ltr",
    fonts: "latin",
  },
  uk: {
    nativeName: "Українська",
    englishName: "Ukrainian",
    dir: "ltr",
    fonts: "cyrillic",
  },
} satisfies Record<Locale, LocaleMeta>;

export const isLocale = (value: string): value is Locale =>
  (routing.locales as readonly string[]).includes(value);

/** Falls back to the default locale's metadata for unroutable input. */
export const metaFor = (locale: string): LocaleMeta =>
  isLocale(locale) ? localeMeta[locale] : localeMeta[routing.defaultLocale];

/** `""` for the default locale (which is unprefixed), `/<locale>` otherwise. */
export const localePathPrefix = (locale: string) =>
  locale === routing.defaultLocale ? "" : `/${locale}`;

/** `alternates.languages` for a locale-agnostic path such as `/`. */
export const localeAlternates = (path: string) => {
  const suffix = path === "/" ? "" : path;
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${localePathPrefix(locale)}${suffix}` || "/";
  }
  languages["x-default"] = suffix || "/";
  return languages;
};
