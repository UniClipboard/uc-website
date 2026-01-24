export const FORM_URLS = {
  zh: "https://docs.google.com/forms/d/1KPXqDJUUjPdpW-jeUrNBuTR5huJmMB2MI7avDoUTndo",
  en: "https://docs.google.com/forms/d/1KPXqDJUUjPdpW-jeUrNBuTR5huJmMB2MI7avDoUTndo",
} as const;

export type Locale = keyof typeof FORM_URLS;

export function getFormUrl(locale: Locale): string {
  return FORM_URLS[locale] || FORM_URLS.en;
}
