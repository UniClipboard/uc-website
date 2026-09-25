import { defineRouting } from "next-intl/routing";

// The transfer site's own locale set, wider than the website's. The website
// keeps its routing in the repository's src/i18n; this file shadows it for
// every module in this app (see the `@/*` fallback in tsconfig.json). Each
// locale needs a message file (scripts/prepare.mjs); prerendering fails
// without one.
export const routing = defineRouting({
  locales: [
    "en",
    "zh",
    "zh-Hant",
    "ja",
    "ko",
    "es",
    "fr",
    "de",
    "pt-BR",
    "ru",
    "it",
    "tr",
    "vi",
    "id",
    "ar",
    "hi",
    "th",
    "pl",
    "nl",
    "uk",
  ],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
