import { NextResponse } from "next/server";

import { syncLatestRelease } from "@/lib/changelog-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await syncLatestRelease();
  return NextResponse.json(result, {
    status: result.status === "skipped" ? 502 : 200,
    headers: { "cache-control": "no-store" },
  });
}
