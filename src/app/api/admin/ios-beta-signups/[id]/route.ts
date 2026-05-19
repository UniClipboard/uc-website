import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { setIosBetaSignupInvited } from "@/lib/ios-beta-signups";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  invited: z.boolean(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await ctx.params;
  let parsed;
  try {
    const body = await req.json();
    parsed = updateSchema.parse(body);
  } catch (e) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 400 },
    );
  }

  const updated = await setIosBetaSignupInvited(id, parsed.invited);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: updated.id,
    email: updated.email,
    locale: updated.locale,
    userAgent: updated.userAgent,
    note: updated.note,
    invitedAt: updated.invitedAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
}
