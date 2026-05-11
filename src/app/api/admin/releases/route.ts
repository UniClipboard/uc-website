import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { releases } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const rows = await db
    .select({
      id: releases.id,
      version: releases.version,
      pubDate: releases.pubDate,
      manualOverride: releases.manualOverride,
      updatedAt: releases.updatedAt,
    })
    .from(releases)
    .orderBy(desc(releases.pubDate));

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      version: r.version,
      pubDate: r.pubDate.toISOString(),
      manualOverride: r.manualOverride,
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}
