import { type NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { fetchGithubUser } from "@/lib/sponsors-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const login = new URL(req.url).searchParams.get("login")?.trim();
  if (!login) {
    return NextResponse.json({ error: "Missing login" }, { status: 400 });
  }

  try {
    const user = await fetchGithubUser(login);
    if (!user) {
      return NextResponse.json(
        { error: `GitHub user "${login}" not found` },
        { status: 404 },
      );
    }
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json(
      {
        error: "GitHub lookup failed",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 502 },
    );
  }
}
