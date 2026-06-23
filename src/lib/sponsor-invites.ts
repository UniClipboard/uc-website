import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { sponsorInvites, sponsors } from "@/db/schema";

import type { SponsorTier } from "./sponsors";

/**
 * Self-service sponsor onboarding via single-use invite links.
 *
 * The admin mints a link (optionally pre-setting tier + amount), sends it to a
 * sponsor, and the sponsor fills in their own public profile. We store only the
 * SHA-256 hash of the token — the raw token is shown to the admin exactly once,
 * mirroring how `api_tokens` works. Consuming a link is a single transaction
 * that atomically creates a "pending" sponsor row and marks the link used, so a
 * token can never be redeemed twice even under concurrent submissions.
 */

/** Generate a fresh URL-safe token and its storage hash. */
export function generateInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, tokenHash: hashInviteToken(token) };
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SponsorInviteStatus = "active" | "used" | "expired";

/** Admin-facing view of an invite. Never includes the raw token. */
export type SponsorInviteAdminRow = {
  id: string;
  label: string | null;
  tier: SponsorTier;
  amountCents: number | null;
  expiresAt: string | null;
  usedAt: string | null;
  sponsorId: string | null;
  createdAt: string;
  status: SponsorInviteStatus;
};

type InviteRow = typeof sponsorInvites.$inferSelect;

function deriveStatus(row: InviteRow): SponsorInviteStatus {
  if (row.usedAt) return "used";
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) return "expired";
  return "active";
}

function toAdminRow(row: InviteRow): SponsorInviteAdminRow {
  return {
    id: row.id,
    label: row.label,
    tier: row.tier,
    amountCents: row.amountCents,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    usedAt: row.usedAt?.toISOString() ?? null,
    sponsorId: row.sponsorId,
    createdAt: row.createdAt.toISOString(),
    status: deriveStatus(row),
  };
}

export type CreateInviteInput = {
  label?: string | null;
  tier?: SponsorTier;
  amountCents?: number | null;
  /** Days until the link expires. Omit / null for a link that never expires. */
  expiresInDays?: number | null;
};

/** Mint an invite. Returns the admin row plus the raw token (show once). */
export async function createInvite(
  input: CreateInviteInput,
): Promise<{ invite: SponsorInviteAdminRow; token: string }> {
  const { token, tokenHash } = generateInviteToken();
  const expiresAt =
    typeof input.expiresInDays === "number" && input.expiresInDays > 0
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

  const [row] = await db
    .insert(sponsorInvites)
    .values({
      tokenHash,
      label: input.label ?? null,
      tier: input.tier ?? "regular",
      amountCents: input.amountCents ?? null,
      expiresAt,
    })
    .returning();

  return { invite: toAdminRow(row), token };
}

export async function listInvites(): Promise<SponsorInviteAdminRow[]> {
  const rows = await db
    .select()
    .from(sponsorInvites)
    .orderBy(desc(sponsorInvites.createdAt));
  return rows.map(toAdminRow);
}

export async function deleteInvite(id: string): Promise<boolean> {
  const result = await db
    .delete(sponsorInvites)
    .where(eq(sponsorInvites.id, id))
    .returning({ id: sponsorInvites.id });
  return result.length > 0;
}

/**
 * Validate a raw token without consuming it — used to gate the claim page and
 * the token-scoped GitHub lookup. Deliberately omits the admin-only amount so
 * nothing about the preset sponsorship leaks to the sponsor.
 */
export async function getInviteState(
  token: string,
): Promise<
  | { valid: true; tier: SponsorTier }
  | { valid: false; reason: "not_found" | "used" | "expired" }
> {
  const [row] = await db
    .select()
    .from(sponsorInvites)
    .where(eq(sponsorInvites.tokenHash, hashInviteToken(token)))
    .limit(1);
  if (!row) return { valid: false, reason: "not_found" };
  const status = deriveStatus(row);
  if (status === "used") return { valid: false, reason: "used" };
  if (status === "expired") return { valid: false, reason: "expired" };
  return { valid: true, tier: row.tier };
}

/** Public profile a sponsor submits through their invite link. */
export type SponsorSubmission = {
  name: string;
  url?: string | null;
  note?: string | null;
  githubLogin?: string | null;
  /** External avatar URL (e.g. GitHub CDN). Used when no upload is present. */
  avatarUrl?: string | null;
  /** Processed (downscaled webp) avatar as base64. Wins over `avatarUrl`. */
  avatarData?: string | null;
  avatarMime?: string | null;
};

export type ConsumeResult =
  | { ok: true; sponsorId: string }
  | { ok: false; reason: "not_found" | "used" | "expired" };

/**
 * Atomically consume a token and create a pending sponsor in one transaction.
 * The row inherits the invite's tier + amount and starts "pending" so it only
 * reaches the wall after an admin approves it. The token row is locked
 * `for update` so two concurrent submissions can't both succeed.
 */
export async function consumeInvite(
  token: string,
  submission: SponsorSubmission,
): Promise<ConsumeResult> {
  const tokenHash = hashInviteToken(token);
  return db.transaction(async (tx) => {
    const [invite] = await tx
      .select()
      .from(sponsorInvites)
      .where(eq(sponsorInvites.tokenHash, tokenHash))
      .limit(1)
      .for("update");
    if (!invite) return { ok: false, reason: "not_found" } as const;
    if (invite.usedAt) return { ok: false, reason: "used" } as const;
    if (invite.expiresAt && invite.expiresAt.getTime() <= Date.now())
      return { ok: false, reason: "expired" } as const;

    const [{ max }] = await tx
      .select({ max: sql<number | null>`max(${sponsors.displayOrder})` })
      .from(sponsors);
    const displayOrder = (max ?? -1) + 1;

    const hasUpload =
      typeof submission.avatarData === "string" && submission.avatarData;
    const [created] = await tx
      .insert(sponsors)
      .values({
        name: submission.name,
        url: submission.url ?? null,
        tier: invite.tier,
        status: "pending",
        note: submission.note ?? null,
        amountCents: invite.amountCents,
        githubLogin: submission.githubLogin ?? null,
        avatarUrl: hasUpload ? null : (submission.avatarUrl ?? null),
        avatarData: hasUpload ? submission.avatarData : null,
        avatarMime: hasUpload ? (submission.avatarMime ?? "image/webp") : null,
        displayOrder,
      })
      .returning({ id: sponsors.id });

    await tx
      .update(sponsorInvites)
      .set({ usedAt: new Date(), sponsorId: created.id })
      .where(eq(sponsorInvites.id, invite.id));

    return { ok: true, sponsorId: created.id } as const;
  });
}
