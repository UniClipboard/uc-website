import "server-only";

import { asc, eq, sql } from "drizzle-orm";
import sharp from "sharp";

import { db } from "@/db/client";
import { sponsors } from "@/db/schema";

import type { Sponsor, SponsorTier } from "./sponsors";

type SponsorRow = typeof sponsors.$inferSelect;

/** Largest accepted raw upload before downscaling (guards against abuse). */
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // 6 MB
/** Square size we downscale avatars to. Wall renders them at ~40px. */
const AVATAR_SIZE = 160;

/** Resolve a row's avatar to a URL the wall/admin can render, or undefined. */
function resolveAvatar(row: SponsorRow): string | undefined {
  if (row.avatarData) {
    // Cache-bust on update so the immutable-cached serving route refreshes.
    return `/api/sponsor-avatar/${row.id}?v=${row.updatedAt.getTime()}`;
  }
  return row.avatarUrl ?? undefined;
}

/**
 * Public wall list — gold sponsors first, then by display order, then by
 * creation time. Returns the isomorphic `Sponsor` display shape.
 */
export async function getPublicSponsors(): Promise<Sponsor[]> {
  const rows = await db
    .select()
    .from(sponsors)
    .orderBy(
      sql`case when ${sponsors.tier} = 'gold' then 0 else 1 end`,
      asc(sponsors.displayOrder),
      asc(sponsors.createdAt),
    );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    url: row.url ?? undefined,
    since: row.since ?? undefined,
    note: row.note ?? undefined,
    avatar: resolveAvatar(row),
    tier: row.tier,
  }));
}

/** Admin DTO — never ships the base64 blob, just whether one exists + preview. */
export type SponsorAdminRow = {
  id: string;
  name: string;
  url: string | null;
  tier: SponsorTier;
  since: string | null;
  note: string | null;
  githubLogin: string | null;
  avatar: string | null;
  hasUpload: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

const toAdminRow = (row: SponsorRow): SponsorAdminRow => ({
  id: row.id,
  name: row.name,
  url: row.url,
  tier: row.tier,
  since: row.since,
  note: row.note,
  githubLogin: row.githubLogin,
  avatar: resolveAvatar(row) ?? null,
  hasUpload: Boolean(row.avatarData),
  displayOrder: row.displayOrder,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export async function listAllSponsors(): Promise<SponsorAdminRow[]> {
  const rows = await db
    .select()
    .from(sponsors)
    .orderBy(asc(sponsors.displayOrder), asc(sponsors.createdAt));
  return rows.map(toAdminRow);
}

/** Raw avatar bytes for the serving route. */
export async function getSponsorAvatar(
  id: string,
): Promise<{ data: Buffer; mime: string } | null> {
  const [row] = await db
    .select({
      avatarData: sponsors.avatarData,
      avatarMime: sponsors.avatarMime,
    })
    .from(sponsors)
    .where(eq(sponsors.id, id))
    .limit(1);
  if (!row?.avatarData) return null;
  return {
    data: Buffer.from(row.avatarData, "base64"),
    mime: row.avatarMime ?? "image/webp",
  };
}

export type SponsorWrite = {
  name: string;
  url?: string | null;
  tier?: SponsorTier;
  since?: string | null;
  note?: string | null;
  githubLogin?: string | null;
  /** External avatar URL (e.g. GitHub CDN). Cleared if an upload is set. */
  avatarUrl?: string | null;
  /** Processed (downscaled webp) avatar as base64. Clears `avatarUrl`. */
  avatarData?: string | null;
  avatarMime?: string | null;
  displayOrder?: number | null;
};

async function nextDisplayOrder(): Promise<number> {
  const [row] = await db
    .select({ max: sql<number | null>`max(${sponsors.displayOrder})` })
    .from(sponsors);
  return (row?.max ?? -1) + 1;
}

export async function createSponsor(
  input: SponsorWrite,
): Promise<SponsorAdminRow> {
  const displayOrder =
    typeof input.displayOrder === "number"
      ? input.displayOrder
      : await nextDisplayOrder();
  const hasUpload = typeof input.avatarData === "string" && input.avatarData;
  const [inserted] = await db
    .insert(sponsors)
    .values({
      name: input.name,
      url: input.url ?? null,
      tier: input.tier ?? "regular",
      since: input.since ?? null,
      note: input.note ?? null,
      githubLogin: input.githubLogin ?? null,
      // An upload wins over an external URL; never keep both.
      avatarUrl: hasUpload ? null : (input.avatarUrl ?? null),
      avatarData: hasUpload ? input.avatarData : null,
      avatarMime: hasUpload ? (input.avatarMime ?? "image/webp") : null,
      displayOrder,
    })
    .returning();
  return toAdminRow(inserted);
}

export async function updateSponsor(
  id: string,
  patch: Partial<SponsorWrite> & {
    /** explicit avatar removal */ clearAvatar?: boolean;
  },
): Promise<SponsorAdminRow | null> {
  const set: Partial<typeof sponsors.$inferInsert> = { updatedAt: new Date() };

  if (patch.name !== undefined) set.name = patch.name;
  if (patch.url !== undefined) set.url = patch.url;
  if (patch.tier !== undefined) set.tier = patch.tier;
  if (patch.since !== undefined) set.since = patch.since;
  if (patch.note !== undefined) set.note = patch.note;
  if (patch.githubLogin !== undefined) set.githubLogin = patch.githubLogin;
  if (typeof patch.displayOrder === "number")
    set.displayOrder = patch.displayOrder;

  if (patch.clearAvatar) {
    set.avatarUrl = null;
    set.avatarData = null;
    set.avatarMime = null;
  } else if (typeof patch.avatarData === "string" && patch.avatarData) {
    // New upload replaces any external URL.
    set.avatarData = patch.avatarData;
    set.avatarMime = patch.avatarMime ?? "image/webp";
    set.avatarUrl = null;
  } else if (patch.avatarUrl !== undefined) {
    // New external URL replaces any upload.
    set.avatarUrl = patch.avatarUrl;
    set.avatarData = null;
    set.avatarMime = null;
  }

  const [row] = await db
    .update(sponsors)
    .set(set)
    .where(eq(sponsors.id, id))
    .returning();
  return row ? toAdminRow(row) : null;
}

export async function deleteSponsor(id: string): Promise<boolean> {
  const result = await db
    .delete(sponsors)
    .where(eq(sponsors.id, id))
    .returning({ id: sponsors.id });
  return result.length > 0;
}

/**
 * Downscale an uploaded image to a small square webp and return it as base64.
 * Accepts a data URI or bare base64. Throws on oversized or invalid input.
 */
export async function processAvatarUpload(
  base64Input: string,
): Promise<{ data: string; mime: string }> {
  const bare = base64Input.includes(",")
    ? base64Input.slice(base64Input.indexOf(",") + 1)
    : base64Input;
  const buffer = Buffer.from(bare, "base64");
  if (buffer.length === 0) throw new Error("Empty image");
  if (buffer.length > MAX_UPLOAD_BYTES) throw new Error("Image too large");

  const out = await sharp(buffer)
    .rotate() // honour EXIF orientation
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toBuffer();

  return { data: out.toString("base64"), mime: "image/webp" };
}

export type GithubUser = {
  login: string;
  name: string | null;
  avatarUrl: string;
  htmlUrl: string;
};

/**
 * Look up a public GitHub user. Returns null on 404. Unauthenticated calls are
 * limited to 60/hr; set GITHUB_TOKEN to raise the limit.
 */
export async function fetchGithubUser(
  login: string,
): Promise<GithubUser | null> {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(
    `https://api.github.com/users/${encodeURIComponent(login)}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "uniclipboard-admin",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API responded ${res.status}`);
  }
  const data = (await res.json()) as {
    login: string;
    name: string | null;
    avatar_url: string;
    html_url: string;
  };
  return {
    login: data.login,
    name: data.name ?? null,
    avatarUrl: data.avatar_url,
    htmlUrl: data.html_url,
  };
}
