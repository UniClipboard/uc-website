import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: [
    "en",
    "zh",
    "ru",
    "es",
    "fr",
    "de",
    "pt-BR",
    "ja",
    "ko",
    "ar",
    "hi",
    "zh-TW",
  ],
  defaultLocale: "en",
  localeDetection: false,
  // Page metadata knows which article translations actually exist.
  alternateLinks: false,
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
