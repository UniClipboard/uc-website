import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { consumeInvite, getInviteState } from "@/lib/sponsor-invites";
import { processAvatarUpload } from "@/lib/sponsors-store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ token: string }> };

/** base64url tokens (24 random bytes → 32 chars); keep the guard generous. */
const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;

const emptyToNull = (v: string | null | undefined) => {
  const t = v?.trim();
  return t ? t : null;
};

const submitSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: z
    .string()
    .trim()
    .max(1000)
    .regex(/^https?:\/\//i, "url must start with http:// or https://")
    .optional()
    .nullable()
    .or(z.literal("")),
  note: z.string().trim().max(500).optional().nullable(),
  githubLogin: z.string().trim().max(100).optional().nullable(),
  avatarUrl: z
    .string()
    .trim()
    .max(1000)
    .regex(/^https?:\/\//i, "avatarUrl must start with http:// or https://")
    .optional()
    .nullable()
    .or(z.literal("")),
  /** Raw freshly-chosen image (data URI or base64) — downscaled server-side. */
  avatarUpload: z.string().max(9_000_000).optional().nullable(),
});

/** Map an invalid-token reason to an HTTP status. */
const reasonStatus = (reason: "not_found" | "used" | "expired") =>
  reason === "not_found" ? 404 : 410;

/** Lightweight validity probe — lets the form re-check before submitting. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json(
      { valid: false, reason: "not_found" },
      { status: 404 },
    );
  }
  const state = await getInviteState(token);
  if (!state.valid) {
    return NextResponse.json(state, { status: reasonStatus(state.reason) });
  }
  return NextResponse.json({ valid: true });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json(
      { error: "Invalid or expired link", reason: "not_found" },
      { status: 404 },
    );
  }

  let parsed;
  try {
    const body = await req.json();
    parsed = submitSchema.parse(body);
  } catch (e) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 400 },
    );
  }

  let avatar: { data: string; mime: string } | null = null;
  if (parsed.avatarUpload) {
    try {
      avatar = await processAvatarUpload(parsed.avatarUpload);
    } catch (e) {
      return NextResponse.json(
        {
          error: "Invalid image",
          details: e instanceof Error ? e.message : String(e),
        },
        { status: 400 },
      );
    }
  }

  const result = await consumeInvite(token, {
    name: parsed.name,
    url: emptyToNull(parsed.url),
    note: emptyToNull(parsed.note),
    githubLogin: emptyToNull(parsed.githubLogin),
    avatarUrl: avatar ? null : emptyToNull(parsed.avatarUrl),
    avatarData: avatar?.data ?? null,
    avatarMime: avatar?.mime ?? null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Invalid or expired link", reason: result.reason },
      { status: reasonStatus(result.reason) },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
