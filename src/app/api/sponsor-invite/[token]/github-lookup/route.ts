import { type NextRequest, NextResponse } from "next/server";

import { getInviteState } from "@/lib/sponsor-invites";
import { fetchGithubUser } from "@/lib/sponsors-store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ token: string }> };

const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;

/**
 * GitHub lookup for the public claim form. Gated behind a still-valid invite
 * token so it can't be abused as an open GitHub-proxy / rate-limit sink.
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }
  const state = await getInviteState(token);
  if (!state.valid) {
    return NextResponse.json(
      { error: "Invalid or expired link" },
      { status: state.reason === "not_found" ? 404 : 410 },
    );
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
