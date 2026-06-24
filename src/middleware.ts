import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const ADMIN_PATH_REGEX = /^\/(?:(?:en|zh)\/)?admin(?:\/|$)/;
const ADMIN_API_REGEX = /^\/api\/admin(?:\/|$)/;
const PUBLIC_ADMIN_REGEX = /^\/admin\/(?:sign-in|forbidden)(?:\/|$)/;

const isAdminRoute = (path: string) =>
  ADMIN_API_REGEX.test(path) || ADMIN_PATH_REGEX.test(path);

const adminMiddleware = clerkMiddleware(async (auth, req: NextRequest) => {
  const path = req.nextUrl.pathname;

  // 1) /api/admin/* — userId check only; email allowlist enforced in route handlers
  if (ADMIN_API_REGEX.test(path)) {
    const session = await auth();
    if (!session.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return NextResponse.next();
  }

  // 2) /admin/* and /[locale]/admin/* — canonicalize URL, then rewrite to /en/admin/*
  const localeMatch = path.match(/^\/(?:en|zh)(\/admin(?:\/.*)?)$/);
  if (localeMatch) {
    const url = req.nextUrl.clone();
    url.pathname = localeMatch[1];
    return NextResponse.redirect(url);
  }

  if (PUBLIC_ADMIN_REGEX.test(path)) {
    const url = req.nextUrl.clone();
    url.pathname = "/en" + path;
    return NextResponse.rewrite(url);
  }

  // userId check only; email allowlist enforced inside the (authed) layout
  const session = await auth();
  if (!session.userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/sign-in";
    url.searchParams.set("redirect_url", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const url = req.nextUrl.clone();
  url.pathname = "/en" + path;
  return NextResponse.rewrite(url);
});

// next-intl ships responses with `Cache-Control: private` and a `NEXT_LOCALE`
// Set-Cookie, which makes both Vercel Edge and Cloudflare bypass the cache.
// For 2xx public content pages the locale is already encoded in the URL, so
// the cookie is redundant — strip it and rewrite Cache-Control so the CDN can
// serve these pages. For 3xx redirects we MUST keep Set-Cookie because that
// is how next-intl persists a user's locale selection; stripping it sends
// users with a non-default Accept-Language back to their detected locale on
// every navigation. CDNs refuse to cache Set-Cookie responses anyway, so we
// just bypass cache for redirects.
function applyPublicCdnCache(res: NextResponse): NextResponse {
  if (res.status >= 200 && res.status < 300) {
    res.headers.delete("set-cookie");
    res.headers.set(
      "cache-control",
      "public, s-maxage=1800, stale-while-revalidate=86400",
    );
  }
  return res;
}

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const path = req.nextUrl.pathname;
  if (isAdminRoute(path)) {
    return adminMiddleware(req, event);
  }
  // Token-authenticated API routes (e.g. /api/v1/*) bypass intl rewriting.
  if (path.startsWith("/api/")) {
    return NextResponse.next();
  }
  const res = intlMiddleware(req);
  if (req.method === "GET" || req.method === "HEAD") {
    return applyPublicCdnCache(res);
  }
  return res;
}

export const config = {
  matcher: [
    // Pages: run intl middleware everywhere except Next internals, the docs
    // proxy, files with extensions, and ALL API routes (added `api` to the
    // negative lookahead — API routes don't need locale routing).
    "/((?!api|_next|_vercel|docs|.*\\..*).*)",
    // Only admin APIs need Clerk auth in middleware. Other API routes
    // (v1, cron, sponsor-avatar, sponsor-invite) authenticate inside their
    // own handlers, so skip the middleware invocation entirely for them.
    "/api/admin/:path*",
  ],
};
