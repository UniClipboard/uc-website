import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

// Links carry an explicit language. A cookie/Accept-Language must not reroute
// an English connection link or make CDN content vary by visitor.
const intl = createMiddleware({
  ...routing,
  localeDetection: false,
  localeCookie: false,
});
export default function middleware(request: NextRequest) {
  const response = intl(request);
  if (response.status >= 200 && response.status < 300) {
    response.headers.delete("set-cookie");
    response.headers.set(
      "cache-control",
      "public, s-maxage=1800, stale-while-revalidate=86400",
    );
  }
  return response;
}
export const config = { matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"] };
