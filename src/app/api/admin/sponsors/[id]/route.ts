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

/** Canonical UUID form — guards the DB's uuid column from cast errors (→ 500). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  url: z
    .string()
    .trim()
    .max(1000)
    .regex(/^https?:\/\//i, "url must start with http:// or https://")
    .nullable()
    .optional()
    .or(z.literal("")),
  tier: z.enum(["gold", "regular"]).optional(),
  status: z.enum(["pending", "published"]).optional(),
  since: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, "since must be YYYY-MM")
    .nullable()
    .optional()
    .or(z.literal("")),
  note: z.string().trim().max(500).nullable().optional(),
  /** Sponsorship amount in cents (CNY). Admin-only. Capped to fit int4. */
  amountCents: z.number().int().min(0).max(2_000_000_000).nullable().optional(),
  githubLogin: z.string().trim().max(100).nullable().optional(),
  avatarUrl: z
    .string()
    .trim()
    .max(1000)
    .regex(/^https?:\/\//i, "avatarUrl must start with http:// or https://")
    .nullable()
    .optional()
    .or(z.literal("")),
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
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid sponsor id" }, { status: 400 });
  }
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
  if (parsed.status !== undefined) patch.status = parsed.status;
  if (parsed.since !== undefined) patch.since = emptyToNull(parsed.since);
  if (parsed.note !== undefined) patch.note = emptyToNull(parsed.note);
  if (parsed.amountCents !== undefined) patch.amountCents = parsed.amountCents;
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
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid sponsor id" }, { status: 400 });
  }
  const ok = await deleteSponsor(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
