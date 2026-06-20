import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { swapSponsorOrder } from "@/lib/sponsors-store";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const bodySchema = z.object({
  idA: z.string().regex(UUID_RE),
  idB: z.string().regex(UUID_RE),
});

/**
 * Swap the display order of two sponsors atomically. Doing both updates in one
 * server-side transaction avoids the inconsistent state two independent PATCHes
 * could leave if one succeeded and the other failed.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 400 },
    );
  }

  if (parsed.idA === parsed.idB) {
    return NextResponse.json({ ok: true });
  }

  const ok = await swapSponsorOrder(parsed.idA, parsed.idB);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
