import { localePathPrefix } from "@/i18n/locale-meta";

// Leave unset until the independent site's production acceptance and backend
// CORS handoff are complete. This single build-time switch also gates redirects.
export const trySiteUrl = process.env.NEXT_PUBLIC_TRY_SITE_URL?.replace(
  /\/$/,
  "",
);

export function getTryHref(locale: string): string {
  return trySiteUrl
    ? `${trySiteUrl}${localePathPrefix(locale) || "/"}`
    : "/try";
}
