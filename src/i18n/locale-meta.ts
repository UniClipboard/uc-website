import { type Locale, routing } from "./routing";

type LocaleMeta = {
  /** Short uppercase code shown in compact UI (e.g. the language switcher trigger). */
  label: string;
  /** The language's own name, shown to users choosing a language. */
  nativeName: string;
  /** English name of the language, for machine-facing indexes like llms.txt. */
  englishName: string;
  /** `openGraph.locale` — OpenGraph wants a `language_TERRITORY` tag. */
  ogLocale: string;
  /** Static share image under `public/`. */
  ogImage: string;
  /** JSON-LD `inLanguage` — a BCP 47 tag. */
  inLanguage: string;
  /** Passed to `Intl.DateTimeFormat`. */
  dateLocale: string;
  /**
   * Which glyphs this locale's text actually needs. Drives font subsetting —
   * a Latin page must not pay for CJK or Cyrillic bytes it never renders.
   */
  script: "latin" | "cjk" | "cyrillic" | "arabic" | "devanagari";
  dir: "ltr" | "rtl";
};

// Every locale-dependent presentation value lives here, so adding a locale is
// one entry plus the compile errors TypeScript points you at. The old shape was
// a `locale === "zh" ? A : B` ternary repeated ~40 times, which silently served
// English to any third locale instead of failing the build.
export const localeMeta = {
  en: {
    dir: "ltr",
    label: "EN",
    nativeName: "English",
    englishName: "English",
    ogLocale: "en_US",
    ogImage: "/og-en.jpg",
    inLanguage: "en",
    dateLocale: "en-US",
    script: "latin",
  },
  zh: {
    dir: "ltr",
    label: "ZH",
    nativeName: "简体中文",
    englishName: "Simplified Chinese",
    ogLocale: "zh_CN",
    ogImage: "/og-zh.jpg",
    inLanguage: "zh-CN",
    dateLocale: "zh-CN",
    script: "cjk",
  },
  ru: {
    dir: "ltr",
    label: "RU",
    nativeName: "Русский",
    englishName: "Russian",
    ogLocale: "ru_RU",
    // No Russian share image has been designed yet; the English one is a
    // deliberate stand-in. Swap to `/og-ru.jpg` once the asset lands.
    ogImage: "/og-en.jpg",
    inLanguage: "ru",
    dateLocale: "ru-RU",
    script: "cyrillic",
  },
  es: {
    label: "ES",
    nativeName: "Español",
    englishName: "Spanish",
    ogLocale: "es_ES",
    inLanguage: "es",
    dateLocale: "es",
    script: "latin",
    dir: "ltr",
    ogImage: "/og-en.jpg",
  },
  fr: {
    label: "FR",
    nativeName: "Français",
    englishName: "French",
    ogLocale: "fr_FR",
    inLanguage: "fr",
    dateLocale: "fr",
    script: "latin",
    dir: "ltr",
    ogImage: "/og-en.jpg",
  },
  de: {
    label: "DE",
    nativeName: "Deutsch",
    englishName: "German",
    ogLocale: "de_DE",
    inLanguage: "de",
    dateLocale: "de",
    script: "latin",
    dir: "ltr",
    ogImage: "/og-en.jpg",
  },
  "pt-BR": {
    label: "PT-BR",
    nativeName: "Português (Brasil)",
    englishName: "Brazilian Portuguese",
    ogLocale: "pt_BR",
    inLanguage: "pt-BR",
    dateLocale: "pt-BR",
    script: "latin",
    dir: "ltr",
    ogImage: "/og-en.jpg",
  },
  ja: {
    label: "JA",
    nativeName: "日本語",
    englishName: "Japanese",
    ogLocale: "ja_JP",
    inLanguage: "ja",
    dateLocale: "ja",
    script: "cjk",
    dir: "ltr",
    ogImage: "/og-en.jpg",
  },
  ko: {
    label: "KO",
    nativeName: "한국어",
    englishName: "Korean",
    ogLocale: "ko_KR",
    inLanguage: "ko",
    dateLocale: "ko",
    script: "cjk",
    dir: "ltr",
    ogImage: "/og-en.jpg",
  },
  ar: {
    label: "AR",
    nativeName: "العربية",
    englishName: "Arabic",
    ogLocale: "ar_SA",
    inLanguage: "ar",
    dateLocale: "ar",
    script: "arabic",
    dir: "rtl",
    ogImage: "/og-en.jpg",
  },
  hi: {
    label: "HI",
    nativeName: "हिन्दी",
    englishName: "Hindi",
    ogLocale: "hi_IN",
    inLanguage: "hi",
    dateLocale: "hi",
    script: "devanagari",
    dir: "ltr",
    ogImage: "/og-en.jpg",
  },
  "zh-TW": {
    label: "ZH-TW",
    nativeName: "繁體中文",
    englishName: "Traditional Chinese",
    ogLocale: "zh_TW",
    inLanguage: "zh-TW",
    dateLocale: "zh-TW",
    script: "cjk",
    dir: "ltr",
    ogImage: "/og-en.jpg",
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

/**
 * Builds `alternates.languages` for a locale-agnostic path such as `/sponsor`.
 * Pass `locales` to narrow the set — article routes only exist in the locales
 * their content has been authored in, and advertising an hreflang for a URL
 * that 404s is worse than omitting it.
 */
export const localeAlternates = (
  path: string,
  locales: readonly string[] = routing.locales,
) => {
  const suffix = path === "/" ? "" : path;
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[metaFor(locale).inLanguage] =
      `${localePathPrefix(locale)}${suffix}` || "/";
  }
  languages["x-default"] = suffix || "/";
  return languages;
};
