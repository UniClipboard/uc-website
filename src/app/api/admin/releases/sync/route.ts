import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { syncLatestRelease } from "@/lib/changelog-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const result = await syncLatestRelease();
  return NextResponse.json(result, {
    status: result.status === "skipped" ? 502 : 200,
    headers: { "cache-control": "no-store" },
  });
}
