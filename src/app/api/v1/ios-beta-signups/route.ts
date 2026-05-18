import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createIosBetaSignup } from "@/lib/ios-beta-signups";

export const runtime = "nodejs";

const submitSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  locale: z.string().trim().min(2).max(10).optional().nullable(),
});

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof submitSchema>;
  try {
    const body = await req.json();
    parsed = submitSchema.parse(body);
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_email" },
      { status: 400 },
    );
  }

  const userAgent = req.headers.get("user-agent");

  try {
    const result = await createIosBetaSignup({
      email: parsed.email,
      locale: parsed.locale ?? null,
      userAgent: userAgent?.slice(0, 1024) ?? null,
    });
    return NextResponse.json({ ok: true, status: result.status });
  } catch (err) {
    console.error("[ios-beta-signups] insert failed", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
