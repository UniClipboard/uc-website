import { type NextRequest, NextResponse } from "next/server";

import { getSponsorAvatar } from "@/lib/sponsors-store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  // `v` is the `updatedAt` cache-buster; anything else shares one cache entry
  // instead of minting a new one per arbitrary query string.
  const v = req.nextUrl.searchParams.get("v") ?? "";
  const avatar = await getSponsorAvatar(id, /^\d{1,15}$/.test(v) ? v : "");
  if (!avatar) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(avatar.data), {
    headers: {
      "Content-Type": avatar.mime,
      // Immutable: the public URL carries a ?v=updatedAt cache-buster.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
