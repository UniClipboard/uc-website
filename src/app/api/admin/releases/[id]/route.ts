import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db/client";
import { releases } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { RELEASES_CACHE_TAG } from "@/lib/changelog-sync";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z
  .object({
    notesEn: z.string().min(1).max(64_000).optional(),
    notesZh: z.string().min(1).max(64_000).optional(),
    manualOverride: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.notesEn !== undefined ||
      v.notesZh !== undefined ||
      v.manualOverride !== undefined,
    { message: "no fields to update" },
  );

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
    parsed = patchSchema.parse(body);
  } catch (e) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 400 },
    );
  }

  const existing = await db
    .select()
    .from(releases)
    .where(eq(releases.id, id))
    .limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.notesEn !== undefined) patch.notesEn = parsed.notesEn;
  if (parsed.notesZh !== undefined) patch.notesZh = parsed.notesZh;
  // Any notes edit implies the admin wants their changes preserved across syncs.
  if (parsed.notesEn !== undefined || parsed.notesZh !== undefined) {
    patch.manualOverride = parsed.manualOverride ?? true;
  } else if (parsed.manualOverride !== undefined) {
    patch.manualOverride = parsed.manualOverride;
  }

  await db.update(releases).set(patch).where(eq(releases.id, id));
  revalidateTag(RELEASES_CACHE_TAG);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await ctx.params;
  const existing = await db
    .select({ id: releases.id })
    .from(releases)
    .where(eq(releases.id, id))
    .limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(releases).where(eq(releases.id, id));
  revalidateTag(RELEASES_CACHE_TAG);

  return NextResponse.json({ ok: true });
}
