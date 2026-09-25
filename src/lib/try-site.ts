// Leave unset until the independent site's production acceptance and backend
// CORS handoff are complete. This single build-time switch also gates redirects.
export const trySiteUrl = process.env.NEXT_PUBLIC_TRY_SITE_URL?.replace(
  /\/$/,
  "",
);

// Contract with the independent transfer app. It owns its own routing and
// messages; this map describes website exits, never configures the try app.
const tryLocales = new Set([
  "en",
  "zh",
  "ru",
  "zh-Hant",
  "ja",
  "ko",
  "es",
  "fr",
  "de",
  "pt-BR",
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
]);
export function tryLocaleFor(locale: string): string {
  return locale === "zh-TW"
    ? "zh-Hant"
    : tryLocales.has(locale)
      ? locale
      : "en";
}
export function tryPathFor(locale: string): string {
  const target = tryLocaleFor(locale);
  return target === "en" ? "/" : `/${target}`;
}

export function getTryHref(locale: string): string {
  return trySiteUrl ? `${trySiteUrl}${tryPathFor(locale)}` : "/try";
}
