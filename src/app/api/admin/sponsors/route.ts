import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import {
  createSponsor,
  listAllSponsors,
  processAvatarUpload,
} from "@/lib/sponsors-store";

export const runtime = "nodejs";

const emptyToNull = (v: string | null | undefined) => {
  const t = v?.trim();
  return t ? t : null;
};

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: z
    .string()
    .trim()
    .max(1000)
    .regex(/^https?:\/\//i, "url must start with http:// or https://")
    .optional()
    .nullable()
    .or(z.literal("")),
  tier: z.enum(["gold", "regular"]).optional(),
  since: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, "since must be YYYY-MM")
    .optional()
    .nullable()
    .or(z.literal("")),
  note: z.string().trim().max(500).optional().nullable(),
  /** Sponsorship amount in cents (CNY). Admin-only. Capped to fit int4. */
  amountCents: z.number().int().min(0).max(2_000_000_000).optional().nullable(),
  githubLogin: z.string().trim().max(100).optional().nullable(),
  avatarUrl: z
    .string()
    .trim()
    .max(1000)
    .regex(/^https?:\/\//i, "avatarUrl must start with http:// or https://")
    .optional()
    .nullable()
    .or(z.literal("")),
  /** Raw freshly-chosen image (data URI or base64) — downscaled server-side. */
  avatarUpload: z.string().max(9_000_000).optional().nullable(),
  displayOrder: z.number().int().optional().nullable(),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  const items = await listAllSponsors();
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

  let avatar: { data: string; mime: string } | null = null;
  if (parsed.avatarUpload) {
    try {
      avatar = await processAvatarUpload(parsed.avatarUpload);
    } catch (e) {
      return NextResponse.json(
        {
          error: "Invalid image",
          details: e instanceof Error ? e.message : String(e),
        },
        { status: 400 },
      );
    }
  }

  const created = await createSponsor({
    name: parsed.name,
    url: emptyToNull(parsed.url),
    tier: parsed.tier,
    since: emptyToNull(parsed.since),
    note: emptyToNull(parsed.note),
    amountCents: parsed.amountCents ?? null,
    githubLogin: emptyToNull(parsed.githubLogin),
    avatarUrl: avatar ? null : emptyToNull(parsed.avatarUrl),
    avatarData: avatar?.data ?? null,
    avatarMime: avatar?.mime ?? null,
    displayOrder: parsed.displayOrder ?? null,
  });
  return NextResponse.json(created, { status: 201 });
}
