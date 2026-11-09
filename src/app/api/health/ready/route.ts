import { client } from "@/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    client.prepare("SELECT id FROM articles LIMIT 1").get();
    return Response.json(
      { ok: true },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
