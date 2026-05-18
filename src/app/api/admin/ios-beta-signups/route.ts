import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { listIosBetaSignups } from "@/lib/ios-beta-signups";

export const runtime = "nodejs";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const items = await listIosBetaSignups();
  const format = req.nextUrl.searchParams.get("format");

  if (format === "csv") {
    const header = [
      "email",
      "locale",
      "created_at",
      "invited_at",
      "user_agent",
      "note",
    ].join(",");
    const lines = items.map((row) =>
      [
        row.email,
        row.locale ?? "",
        row.createdAt.toISOString(),
        row.invitedAt?.toISOString() ?? "",
        row.userAgent ?? "",
        row.note ?? "",
      ]
        .map((v) => csvEscape(v))
        .join(","),
    );
    const csv = [header, ...lines].join("\n") + "\n";
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="ios-beta-signups-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({
    items: items.map((row) => ({
      id: row.id,
      email: row.email,
      locale: row.locale,
      userAgent: row.userAgent,
      note: row.note,
      invitedAt: row.invitedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}
