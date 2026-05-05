import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { issueApiToken, listAllApiTokens } from "@/lib/api-token";

export const runtime = "nodejs";

const createSchema = z.object({
  label: z.string().trim().min(1).max(80),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const tokens = await listAllApiTokens();
  return NextResponse.json({ tokens });
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

  const issued = await issueApiToken(parsed.label);
  return NextResponse.json(
    { id: issued.id, label: parsed.label, plaintext: issued.plaintext },
    { status: 201 },
  );
}
