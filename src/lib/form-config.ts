export const FORM_URLS = {
  zh: "https://docs.qq.com/form/page/[PLACEHOLDER]",
  en: "https://forms.google.com/[PLACEHOLDER]",
} as const;

export type Locale = keyof typeof FORM_URLS;

export function getFormUrl(locale: Locale): string {
  return FORM_URLS[locale] || FORM_URLS.en;
}
