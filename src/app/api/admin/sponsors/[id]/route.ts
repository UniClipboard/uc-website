import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import {
  deleteSponsor,
  processAvatarUpload,
  type SponsorWrite,
  updateSponsor,
} from "@/lib/sponsors-store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const emptyToNull = (v: string | null | undefined) => {
  const t = v?.trim();
  return t ? t : null;
};

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  url: z.string().trim().max(1000).nullable().optional(),
  tier: z.enum(["gold", "regular"]).optional(),
  since: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, "since must be YYYY-MM")
    .nullable()
    .optional()
    .or(z.literal("")),
  note: z.string().trim().max(500).nullable().optional(),
  githubLogin: z.string().trim().max(100).nullable().optional(),
  avatarUrl: z.string().trim().max(1000).nullable().optional(),
  avatarUpload: z.string().max(9_000_000).nullable().optional(),
  clearAvatar: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
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

  const patch: Partial<SponsorWrite> & { clearAvatar?: boolean } = {};
  if (parsed.name !== undefined) patch.name = parsed.name;
  if (parsed.url !== undefined) patch.url = emptyToNull(parsed.url);
  if (parsed.tier !== undefined) patch.tier = parsed.tier;
  if (parsed.since !== undefined) patch.since = emptyToNull(parsed.since);
  if (parsed.note !== undefined) patch.note = emptyToNull(parsed.note);
  if (parsed.githubLogin !== undefined)
    patch.githubLogin = emptyToNull(parsed.githubLogin);
  if (parsed.displayOrder !== undefined)
    patch.displayOrder = parsed.displayOrder;

  // Avatar precedence: explicit clear > new upload > new external URL.
  if (parsed.clearAvatar) {
    patch.clearAvatar = true;
  } else if (parsed.avatarUpload) {
    try {
      const avatar = await processAvatarUpload(parsed.avatarUpload);
      patch.avatarData = avatar.data;
      patch.avatarMime = avatar.mime;
    } catch (e) {
      return NextResponse.json(
        {
          error: "Invalid image",
          details: e instanceof Error ? e.message : String(e),
        },
        { status: 400 },
      );
    }
  } else if (parsed.avatarUrl !== undefined) {
    patch.avatarUrl = emptyToNull(parsed.avatarUrl);
  }

  const updated = await updateSponsor(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await ctx.params;
  const ok = await deleteSponsor(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
