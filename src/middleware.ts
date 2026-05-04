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

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (isAdminRoute(req.nextUrl.pathname)) {
    return adminMiddleware(req, event);
  }
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)", "/(api|trpc)(.*)"],
};
