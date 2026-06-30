import { type NextRequest, NextResponse } from "next/server";

import { getPublicSponsors } from "@/lib/sponsors-store";

export const runtime = "nodejs";

/**
 * Public, unauthenticated sponsors feed consumed by the desktop app's
 * "About → Sponsors" section. Mirrors the public sponsor wall on the site but
 * is shaped for an external HTTP client:
 *
 * - No auth (the desktop app holds no API token) and no admin-only fields —
 *   `amountCents` is never exposed here.
 * - Avatar paths are absolutised against the request origin so the desktop
 *   client can load uploaded avatars (served from `/api/sponsor-avatar/...`)
 *   without knowing the site origin.
 * - CORS is wide open (`*`) because the payload is public and read-only; the
 *   desktop webview fetches this cross-origin.
 */

/** Cache for 5 min at the edge; sponsor changes are infrequent. */
const CACHE_CONTROL = "public, max-age=300, s-maxage=300";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const sponsors = await getPublicSponsors();

  const items = sponsors.map((s) => ({
    id: s.id,
    name: s.name,
    url: s.url,
    since: s.since,
    note: s.note,
    // Resolve relative avatar paths (uploaded avatars) to absolute URLs; leave
    // already-absolute external URLs (e.g. GitHub CDN) untouched.
    avatar: s.avatar ? new URL(s.avatar, origin).toString() : undefined,
    tier: s.tier,
  }));

  return NextResponse.json(
    { items, count: items.length },
    {
      headers: {
        ...corsHeaders,
        "Cache-Control": CACHE_CONTROL,
      },
    },
  );
}
