import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import {
  createFounder,
  FOUNDER_PLATFORMS,
  listAllFounders,
} from "@/lib/founders";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  platform: z.enum(FOUNDER_PLATFORMS),
  joinedAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "joinedAt must be YYYY-MM-DD"),
  note: z.string().trim().max(500).optional().nullable(),
  displayOrder: z.number().int().optional().nullable(),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  const items = await listAllFounders();
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

  const created = await createFounder({
    name: parsed.name,
    platform: parsed.platform,
    joinedAt: parsed.joinedAt,
    note: parsed.note ?? null,
    displayOrder: parsed.displayOrder ?? null,
  });
  return NextResponse.json(created, { status: 201 });
}
