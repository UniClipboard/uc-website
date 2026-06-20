import { type NextRequest, NextResponse } from "next/server";

import { getSponsorAvatar } from "@/lib/sponsors-store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const avatar = await getSponsorAvatar(id);
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
