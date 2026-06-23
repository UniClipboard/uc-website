import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { createInvite, listInvites } from "@/lib/sponsor-invites";

export const runtime = "nodejs";

const createSchema = z.object({
  label: z.string().trim().max(200).optional().nullable(),
  tier: z.enum(["gold", "regular"]).optional(),
  /** Pre-set sponsorship amount in cents (CNY). Admin-only. */
  amountCents: z.number().int().min(0).max(2_000_000_000).optional().nullable(),
  /** 0 / null → never expires. */
  expiresInDays: z.number().int().min(0).max(365).optional().nullable(),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  const items = await listInvites();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  let parsed;
  try {
    const body = await req.json();
    parsed = createSchema.parse(body);
  } catch (e) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 400 },
    );
  }

  const label = parsed.label?.trim();
  const { invite, token } = await createInvite({
    label: label ? label : null,
    tier: parsed.tier,
    amountCents: parsed.amountCents ?? null,
    expiresInDays: parsed.expiresInDays ?? null,
  });

  // The raw token is returned exactly once — the client builds the full URL.
  return NextResponse.json({ invite, token }, { status: 201 });
}
